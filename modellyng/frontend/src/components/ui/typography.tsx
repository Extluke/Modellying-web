import React from "react"
import { cn } from "@/lib/utils"

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: "p" | "span" | "div"
}

/** 38px Hero Display (Bold 800, Line-height 1.15, Letter-spacing -1.2px) */
export function DisplayHeading({ className, as: Comp = "h1", ...props }: HeadingProps) {
  return (
    <Comp
      className={cn("text-display-sm text-foreground tracking-tight", className)}
      {...props}
    />
  )
}

/** 28px Main Page Heading (Bold 800, Line-height 1.2, Letter-spacing -0.6px) */
export function PageHeading({ className, as: Comp = "h1", ...props }: HeadingProps) {
  return (
    <Comp
      className={cn("text-headline-md text-foreground tracking-tight", className)}
      {...props}
    />
  )
}

/** 22px Paper Title in Reader/Analysis (Bold 800, Line-height 1.3, Letter-spacing -0.2px) */
export function PaperHeading({ className, as: Comp = "h2", ...props }: HeadingProps) {
  return (
    <Comp
      className={cn("text-headline-sm text-foreground tracking-tight", className)}
      {...props}
    />
  )
}

/** 18px Section / Card Header (SemiBold 700, Line-height 1.35) */
export function SectionHeading({ className, as: Comp = "h3", ...props }: HeadingProps) {
  return (
    <Comp
      className={cn("text-title-lg text-foreground tracking-tight", className)}
      {...props}
    />
  )
}

/** 15px Sub-header / Table Modal Header (SemiBold 700, Line-height 1.4) */
export function TitleMedium({ className, as: Comp = "h4", ...props }: HeadingProps) {
  return (
    <Comp
      className={cn("text-title-md text-foreground", className)}
      {...props}
    />
  )
}

/** 14px Standard Body Text (Regular 400, Line-height 1.45) */
export function BodyText({ className, as: Comp = "p", ...props }: TextProps) {
  return (
    <Comp
      className={cn("text-body-md text-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

/** 12px Metadata & Timestamp Caption (Medium 500, Line-height 1.4, Letter-spacing 0.2px) */
export function MutedCaption({ className, as: Comp = "span", ...props }: TextProps) {
  return (
    <Comp
      className={cn("text-caption-muted text-muted-foreground", className)}
      {...props}
    />
  )
}
