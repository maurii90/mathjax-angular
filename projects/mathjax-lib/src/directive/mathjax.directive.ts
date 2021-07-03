import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MathjaxContent, isMathjax } from './models';

@Directive({
  selector: 'mathjax,[mathjax]',
})
export class MathjaxDirective implements OnChanges {
  //
  private mathJaxExpressions?: MathjaxContent | string;
  //
  private readonly element: HTMLElement;
  //
  @Input('mathjax')
  set mathjax(val: MathjaxContent | string) {
    this.mathJaxExpressions = val;
  }
  //
  constructor(private el: ElementRef) {
    if (this.mathJaxExpressions) {
      this.mathJaxExpressions =
        'string' === typeof this.mathJaxExpressions
          ? (this.mathJaxExpressions as string)
          : (<MathjaxContent>this.mathJaxExpressions).latex ||
            (<MathjaxContent>this.mathJaxExpressions).mathml;
    } else {
      this.element = el.nativeElement;
    }
    this.element = el.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const expressions = changes.mathjax;
    if (
      !expressions ||
      expressions.currentValue === expressions.previousValue
    ) {
      return;
    }
    //
    if ((expressions.currentValue + '')?.match(isMathjax)) {
      const filteredVal = this.fixMathjaxBugs(expressions.currentValue + '');
      this.typeset(() => {
        this.element.innerHTML = `<div>${filteredVal}</div>`;
      });
    } else {
      this.element.innerHTML = expressions.currentValue;
    }
  }

  private fixMathjaxBugs(jax: string): string {
    return (
      jax
        //line break error
        .replace(/<br \/>/gi, '<br/> ')
        //automatic breakline
        .replace(/[$]([\s\S]+?)[$]/gi, (m, p: string, o, s) => {
          //return /s/gi.test(p)
          return p.includes('\\\\') && !p.includes('\\begin')
            ? `$\\begin{align*}${p}\\end{align*}$`
            : `$${p}$`;
        })
    );
  }

  private typeset(code: () => void) {
    if (MathJax?.startup) {
      MathJax.startup.promise = MathJax.startup.promise
        .then(() => {
          code();
          return MathJax.typesetPromise ? MathJax.typesetPromise() : null;
        })
        .catch((err: Error) =>
          console.error('MathJax Typeset failed: ' + err.message)
        );
      return MathJax.startup.promise;
    } else {
      code();
    }
  }
}
