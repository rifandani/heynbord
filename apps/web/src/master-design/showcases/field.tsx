import {
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "@/core/components/ui/field";
import { Input } from "@/core/components/ui/input";
import { TextField } from "@/core/components/ui/text-field";

import { Variant, VariantGrid } from "../variant";

export const FieldShowcase = () => (
  <VariantGrid>
    <Variant label="default">
      <Fieldset className="w-64">
        <Legend>Profile</Legend>
        <Description>Public details for your account.</Description>
        <FieldGroup>
          <TextField defaultValue="Ava Thompson">
            <Label>Name</Label>
            <Input />
            <Description>Shown on your profile.</Description>
          </TextField>
        </FieldGroup>
      </Fieldset>
    </Variant>

    <Variant label="FieldError">
      <TextField className="w-64" defaultValue="not-an-email" isInvalid>
        <Label>Email</Label>
        <Input />
        <FieldError>Please enter a valid email.</FieldError>
      </TextField>
    </Variant>
  </VariantGrid>
);
