import { HiMagnifyingGlass } from "react-icons/hi2";

import { Label } from "@/core/components/ui/field";
import { Input, InputGroup } from "@/core/components/ui/input";
import { TextField } from "@/core/components/ui/text-field";

import { Variant, VariantGrid } from "../variant";

export const InputShowcase = () => (
  <VariantGrid>
    <Variant label="default">
      <TextField className="w-64">
        <Label>Email</Label>
        <Input placeholder="you@example.com" type="email" />
      </TextField>
    </Variant>

    <Variant label="InputGroup">
      <TextField className="w-64">
        <Label>Search</Label>
        <InputGroup>
          <HiMagnifyingGlass data-slot="icon" />
          <Input placeholder="Find something…" />
        </InputGroup>
      </TextField>
    </Variant>

    <Variant label="on parchment">
      <div className="paper-surface bg-overlay text-overlay-fg border-frame-wood shadow-lift w-64 rounded-2xl border-4 p-4">
        <TextField defaultValue="Marrow Castle">
          <Label>Deck name</Label>
          <Input />
        </TextField>
      </div>
    </Variant>

    <Variant label="isDisabled">
      <TextField className="w-64" defaultValue="you@example.com" isDisabled>
        <Label>Email</Label>
        <Input />
      </TextField>
    </Variant>
  </VariantGrid>
);
