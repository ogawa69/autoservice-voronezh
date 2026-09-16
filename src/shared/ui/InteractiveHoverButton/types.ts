import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

interface InteractiveHoverButtonOwnProps<TElement extends ElementType> {
  as?: TElement;
  children: ReactNode;
  className?: string;
}

export type InteractiveHoverButtonProps<
  TElement extends ElementType = "button",
> = InteractiveHoverButtonOwnProps<TElement> &
  Omit<
    ComponentPropsWithoutRef<TElement>,
    keyof InteractiveHoverButtonOwnProps<TElement>
  >;
