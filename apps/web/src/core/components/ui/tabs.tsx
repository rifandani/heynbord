'use client'

import { createContext, use } from "react"
import { composeRenderProps } from "react-aria-components/composeRenderProps"
import { SelectionIndicator } from "react-aria-components/SelectionIndicator"
import { useSlottedContext } from "react-aria-components/slots"
import type {
  TabListProps as TabListPrimitiveProps,
  TabPanelProps as TabPanelPrimitiveProps,
  TabPanelsProps,
  TabProps as TabPrimitiveProps,
  TabsProps as TabsPrimitiveProps,
} from "react-aria-components/Tabs"
import {
  Tab as TabPrimitive,
  TabList as TabListPrimitive,
  TabPanel as TabPanelPrimitive,
  TabPanels as PrimitiveTabPanels,
  Tabs as TabsPrimitive,
  TabsContext,
} from "react-aria-components/Tabs"
import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"

interface TabsProps extends TabsPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}
const Tabs = ({ className, ref, orientation = "horizontal", ...props }: TabsProps) => {
  return (
    <TabsContext value={{ orientation }}>
      <TabsPrimitive
        orientation={orientation}
        className={cx(
          orientation === "vertical" ? "w-full flex-row" : "flex-col",
          "group/tabs flex gap-4 self-start forced-color-adjust-none",
          className
        )}
        ref={ref}
        {...props}
      />
    </TabsContext>
  )
}
interface TabListContextValue {
  selectionIndicator?: boolean
}
const TabListContext = createContext<TabListContextValue | undefined>(undefined)

export function useTabListContext() {
  const context = use(TabListContext)
  if (!context) {
    throw new Error("useTabsContext must be used within TabsContext")
  }
  return context
}

interface TabListProps<T extends object> extends TabListPrimitiveProps<T>, TabListContextValue {
  ref?: React.RefObject<HTMLDivElement>
}
const TabList = <T extends object>({
  className,
  selectionIndicator = true,
  ref,
  ...props
}: TabListProps<T>) => {
  return (
    <TabListContext value={{ selectionIndicator }}>
      <TabListPrimitive
        ref={ref}
        data-slot="tab-list"
        {...props}
        className={composeRenderProps(className, (className, { orientation }) =>
          cn([
            "relative flex forced-color-adjust-none",
            "rounded-lg border-2 border-wood-edge bg-wood/60 p-1 shadow-well",
            orientation === "horizontal" && "flex-row gap-x-1",
            orientation === "vertical" &&
              "min-w-56 shrink-0 flex-col items-start gap-y-1",
            className,
          ])
        )}
      />
    </TabListContext>
  )
}

export function TabScrollArea({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="relative">
      <div className={cn("scrollbar-none overflow-x-auto sm:overflow-x-visible", className)}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full bg-border"
          aria-hidden
        />
        {props.children}
      </div>
    </div>
  )
}

interface TabProps extends TabPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}
const Tab = ({ className, ref, ...props }: TabProps) => {
  const { orientation } = useSlottedContext(TabsContext)!
  const { selectionIndicator } = useTabListContext()
  return (
    <TabPrimitive
      {...props}
      data-slot="tab"
      ref={ref}
      className={cx(
        gameText({ role: "body", tone: "inherit" }),
        "group/tab relative flex cursor-default items-center rounded-md border-2 border-transparent font-semibold whitespace-nowrap outline-none transition [-webkit-tap-highlight-color:transparent]",
        orientation === "horizontal"
          ? "px-3 py-1.5"
          : "w-full justify-start px-4 py-1.5",
        "*:[svg]:-ms-0.5 *:[svg]:me-2 *:[svg]:size-4 *:[svg]:shrink-0 *:[svg]:self-center *:[svg]:text-cream-dim selected:*:[svg]:text-ink-on-gold",
        "text-cream-dim hover:bg-wood-light/70 hover:text-cream",
        "selected:border-gold-deep selected:bg-gradient-to-b selected:from-gold-light selected:to-gold selected:text-ink-on-gold selected:shadow-piece selected:hover:brightness-110",
        "focus-visible:ring-4 focus-visible:ring-(--ring)",
        "disabled:border-dashed disabled:opacity-70 disabled:grayscale",
        "href" in props ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      {composeRenderProps(props.children, (children) => (
        <>
          {children}
          {selectionIndicator && (
            <SelectionIndicator
              data-slot="selected-indicator"
              className={cn(
                "absolute bg-focus-cream duration-200 will-change-transform",
                orientation === "horizontal"
                  ? "inset-e-3 start-3 bottom-0.5 h-0.5 motion-safe:transition-[translate,width]"
                  : "inset-s-0.5 top-2 bottom-2 w-0.5 motion-safe:transition-[translate,height]"
              )}
            />
          )}
        </>
      ))}
    </TabPrimitive>
  )
}

interface TabPanelProps extends TabPanelPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>
}

const TabPanels = <T extends object>(props: TabPanelsProps<T>) => {
  return <PrimitiveTabPanels {...props} />
}

const TabPanel = ({ className, ref, ...props }: TabPanelProps) => {
  return (
    <TabPanelPrimitive
      {...props}
      ref={ref}
      data-slot="tab-panel"
      className={cx("flex-1 text-fg text-sm/6 focus-visible:outline-hidden", className)}
    />
  )
}

export type { TabListProps, TabPanelProps, TabProps, TabsProps }
export { Tab, TabList, TabPanel, TabPanels, Tabs }
