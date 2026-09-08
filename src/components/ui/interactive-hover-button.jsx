import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function InteractiveHoverButton({
  as: Component = "button",
  children,
  className,
  ...props
}) {
  return (
    <Component
      className={cn(
        "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold",
        className
      )}
      {...(Component === "button" ? { type: "button" } : {})}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="interactive-hover-button-fill bg-primary h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-[100.8]"></div>
        <span className="interactive-hover-button-label inline-block transition-[transform,opacity] duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="interactive-hover-button-hover-label text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-[transform,opacity] duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight />
      </div>
    </Component>
  )
}
