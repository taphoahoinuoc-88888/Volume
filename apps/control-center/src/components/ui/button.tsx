import {forwardRef,type ButtonHTMLAttributes} from 'react';
import {cn} from '../../lib/utils';
export const Button=forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement>>(function Button({className,...props},ref){return <button ref={ref} className={cn('button',className)} {...props}/>;});
