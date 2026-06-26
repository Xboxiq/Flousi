import { Plus, Package, Tag } from "@phosphor-icons/react/dist/ssr";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  Stat,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/presentation/components/ui";

export const metadata = { title: "Styleguide" };

/** Living documentation of the design-system primitives. */
export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Flousi Styleguide</h1>
        <p className="mt-2 text-muted">Primitive components rendered from the design tokens.</p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button leadingIcon={<Plus size={16} weight="bold" />}>Add product</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge tone="accent">Active</Badge>
          <Badge tone="success" dot>
            Profitable
          </Badge>
          <Badge tone="danger" dot>
            Loss
          </Badge>
          <Badge tone="warning">Review</Badge>
          <Badge tone="info">Synced</Badge>
        </div>
      </Section>

      <Section title="KPI stats">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Net profit" value="$4,820.50" deltaLabel="+12.4%" tone="success" />
          <Stat label="Revenue" value="$18,300.00" deltaLabel="+6.1%" />
          <Stat label="Expenses" value="$13,479.50" deltaLabel="-2.3%" delta={-0.023} />
          <Stat label="Margin" value="26.3%" tone="success" />
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-md gap-4">
          <Field label="Product name" required helper="As shown to customers.">
            <Input placeholder="Linen tote bag" />
          </Field>
          <Field label="Selling price">
            <Input type="number" leading="$" placeholder="0.00" />
          </Field>
          <Field label="Category">
            <Select
              placeholder="Choose a category"
              options={[
                { label: "Apparel", value: "apparel" },
                { label: "Home", value: "home" },
                { label: "Accessories", value: "accessories" },
              ]}
            />
          </Field>
          <Field label="SKU" error="This SKU is already in use.">
            <Input defaultValue="TOTE-001" invalid />
          </Field>
        </div>
      </Section>

      <Section title="Table">
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Price</TH>
                <TH>Net profit</TH>
                <TH>Margin</TH>
              </TR>
            </THead>
            <TBody>
              {[
                ["Linen tote bag", "$48.00", "$18.20", "37.9%"],
                ["Ceramic mug", "$22.00", "-$1.40", "-6.4%"],
                ["Wool scarf", "$65.00", "$29.10", "44.8%"],
              ].map((row) => (
                <TR key={row[0]}>
                  <TD className="font-medium">{row[0]}</TD>
                  <TD className="font-mono tabular-nums">{row[1]}</TD>
                  <TD
                    className={`font-mono tabular-nums ${row[2].startsWith("-") ? "text-danger" : "text-success"}`}
                  >
                    {row[2]}
                  </TD>
                  <TD className="font-mono tabular-nums text-muted">{row[3]}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </Section>

      <Section title="Card, empty & loading states">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent sales</CardTitle>
              <Tag size={18} className="text-subtle" />
            </CardHeader>
            <CardContent className="text-sm text-muted">
              A standard surface card with header and content.
            </CardContent>
          </Card>
          <EmptyState
            icon={<Package size={24} />}
            title="No products yet"
            description="Add your first product to start tracking profit."
            action={
              <Button size="sm" leadingIcon={<Plus size={16} weight="bold" />}>
                Add product
              </Button>
            }
          />
          <Card className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-subtle">{title}</h2>
      {children}
    </section>
  );
}
