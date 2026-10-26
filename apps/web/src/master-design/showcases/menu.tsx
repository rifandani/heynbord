import { buttonStyles } from "@/core/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/core/components/ui/menu";

import { Variant, VariantGrid } from "../variant";

export const MenuShowcase = () => (
  <VariantGrid>
    <Variant label="default">
      <Menu>
        <MenuTrigger className={buttonStyles({ intent: "outline" })}>
          Open
        </MenuTrigger>
        <MenuContent aria-label="Actions">
          <MenuItem id="a">Edit</MenuItem>
          <MenuItem id="b">Delete</MenuItem>
        </MenuContent>
      </Menu>
    </Variant>
  </VariantGrid>
);
