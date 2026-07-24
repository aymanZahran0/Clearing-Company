import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SlotPicker } from "../../src/components/SlotPicker";
import "../../src/lib/i18n";

describe("SlotPicker", () => {
  it("renders each date once and keeps available dates and times selectable", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <SlotPicker
        slots={[
          {
            id: "morning-25",
            date: "2026-09-25",
            startTime: "09:00",
            endTime: "11:00",
          },
          {
            id: "afternoon-26",
            date: "2026-09-26",
            startTime: "13:00",
            endTime: "15:00",
          },
        ]}
        onChange={onChange}
      />,
    );

    const firstAvailableDay = await waitFor(() => {
      const cell = container.querySelector<HTMLElement>(
        '.ant-picker-cell[title="2026-09-25"]',
      );
      expect(cell).not.toBeNull();
      return cell!;
    });

    expect(firstAvailableDay.textContent?.match(/25/g)).toHaveLength(1);

    const secondAvailableDay = container.querySelector<HTMLElement>(
      '.ant-picker-cell[title="2026-09-26"]',
    );
    expect(secondAvailableDay).not.toBeNull();
    fireEvent.click(secondAvailableDay!);

    const timeButton = await screen.findByRole("button", {
      name: /13:00.*15:00/,
    });
    fireEvent.click(timeButton);

    expect(onChange).toHaveBeenCalledWith("afternoon-26");
  });
});
