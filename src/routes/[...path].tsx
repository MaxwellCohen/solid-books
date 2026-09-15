import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState body="That page isn't in the catalog." title="Page not found">
      <Button class="mt-1" href="/" variant="secondary">
        Back to the shelf
      </Button>
    </EmptyState>
  );
}
