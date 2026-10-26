import { HiArrowRight } from "react-icons/hi2";

import { Button } from "@/core/components/ui/button";

import { Variant, VariantGrid } from "../variant";

const intents = [
  "primary",
  "secondary",
  "outline",
  "plain",
  "success",
  "warning",
  "danger",
] as const;

const sizes = ["xs", "sm", "md", "lg"] as const;

export const ButtonShowcase = () => (
  <div className="flex flex-col gap-8">
    <VariantGrid>
      {intents.map((intent) => (
        <Variant key={intent} label={intent}>
          <Button intent={intent}>Button</Button>
        </Variant>
      ))}
    </VariantGrid>

    <VariantGrid>
      {sizes.map((size) => (
        <Variant key={size} label={size}>
          <Button size={size}>Button</Button>
        </Variant>
      ))}
    </VariantGrid>

    <div className="paper-surface bg-overlay text-overlay-fg border-frame-wood shadow-lift flex flex-col gap-4 rounded-2xl border-4 p-5">
      <p className="text-muted-fg font-mono text-xs">
        on parchment (paper-surface)
      </p>
      <VariantGrid>
        <Variant label="primary">
          <Button intent="primary">Claim</Button>
        </Variant>
        <Variant label="secondary">
          <Button intent="secondary">Cancel</Button>
        </Variant>
        <Variant label="outline">
          <Button intent="outline">Back</Button>
        </Variant>
        <Variant label="plain">
          <Button intent="plain">Read more</Button>
        </Variant>
      </VariantGrid>
    </div>

    <VariantGrid>
      <Variant label="with icon">
        <Button>
          Continue
          <HiArrowRight />
        </Button>
      </Variant>
      <Variant label="isCircle">
        <Button isCircle>Rounded</Button>
      </Variant>
      <Variant label="isPending">
        <Button isPending>Saving</Button>
      </Variant>
      <Variant label="isDisabled">
        <Button isDisabled>Disabled</Button>
      </Variant>
    </VariantGrid>
  </div>
);
