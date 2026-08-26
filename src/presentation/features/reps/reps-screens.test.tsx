import { describe, expect, it, vi, beforeAll } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams("id=x"),
  usePathname: () => "/reps",
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { useDataStore } from "@/presentation/stores/data-store";
import { RepsList } from "./reps-list";
import { RepDetail } from "./rep-detail";
import { CommissionBench } from "./commission-bench";
import { RecordSaleDialog } from "@/presentation/features/products/record-sale-dialog";

beforeAll(async () => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  await useDataStore.getState().init();
});

describe("the team screens, driven", () => {
  it("renders the team screen", () => {
    render(<RepsList />);
    expect(screen.getByText("الفريق")).toBeTruthy();
    expect(screen.getByText("المستحق للفريق")).toBeTruthy();
    expect(screen.getAllByText(/حصته/).length).toBeGreaterThan(0);
  });

  it("renders a rep profile with a derived balance", () => {
    const rep = useDataStore.getState().reps[0];
    render(<RepDetail id={rep.id} />);
    expect(screen.getByText("رصيده المستحق")).toBeTruthy();
    expect(screen.getByText("نظام القسمة المطبَّق عليه")).toBeTruthy();
  });

  it("renders the calibration bench with the client example", () => {
    render(<CommissionBench />);
    expect(screen.getByText("أنظمة القسمة")).toBeTruthy();
    expect(screen.getAllByText("هذا لك").length).toBe(1);
    expect(screen.getAllByText("هذا له").length).toBe(1);
  });

  it("shows no split preview until a rep is chosen", () => {
    const product = useDataStore.getState().products[0];
    render(<RecordSaleDialog product={product} open onClose={() => {}} />);
    expect(screen.getByText("تسجيل عملية بيع")).toBeTruthy();
    expect(screen.queryByText("القسمة قبل الحفظ")).toBeNull();
  });

  it("previews the split live once a rep is chosen, and follows the price", async () => {
    const state = useDataStore.getState();
    const product = state.products[0];
    const rep = state.reps.find((r) => r.status === "active")!;
    const { container } = render(<RecordSaleDialog product={product} open onClose={() => {}} />);
    fireEvent.change(container.querySelector("#rep")!, { target: { value: rep.id } });
    expect(screen.getByText("القسمة قبل الحفظ")).toBeTruthy();
    const before = screen.getByText("هذا له").parentElement!.textContent;
    fireEvent.change(container.querySelector("#unit")!, {
      target: { value: String(product.sellingPrice * 2) },
    });
    // the Living Number glides, so the reading lands rather than jumping
    await waitFor(() => {
      expect(screen.getByText("هذا له").parentElement!.textContent).not.toBe(before);
    });
  });

  it("settles a rep through the gesture, and the derived balance follows", async () => {
    const rep = useDataStore.getState().reps.find((r) => r.status === "active")!;
    const before = useDataStore.getState().settlements.length;
    render(<RepDetail id={rep.id} />);
    fireEvent.click(screen.getByText("تسوية"));
    const thumb = await screen.findByRole("slider");
    fireEvent.keyDown(thumb, { key: "Enter" });
    await waitFor(
      () => {
        expect(useDataStore.getState().settlements.length).toBe(before + 1);
      },
      { timeout: 4000 },
    );
  });

  it("re-reads the bench example when the profit basis changes", async () => {
    render(<CommissionBench />);
    const figure = () => screen.getByText("هذا لك").parentElement!.textContent;
    const before = figure();
    fireEvent.click(screen.getByText("الربح بعد الشراء"));
    await waitFor(() => {
      expect(figure()).not.toBe(before);
    });
  });
});
