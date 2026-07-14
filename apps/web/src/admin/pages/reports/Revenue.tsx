import { Card, Col, DatePicker, Row, Statistic } from "antd";
import { useState } from "react";
import type { Dayjs } from "dayjs";
import { useGetRevenueReportQuery } from "../../../api/reportsApi";
import { formatCurrency } from "../../../lib/formatters";

const { RangePicker } = DatePicker;

// T165 (US8)
export default function Revenue() {
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const { data, isLoading } = useGetRevenueReportQuery(
    range ? { from: range[0].toISOString(), to: range[1].toISOString() } : undefined
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Revenue</h1>
      <RangePicker
        size="large"
        className="mb-4"
        onChange={(values) => setRange(values && values[0] && values[1] ? [values[0], values[1]] : null)}
      />
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="Completed Bookings" value={data?.completedBookings ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Total Revenue"
              value={data ? formatCurrency(data.totalRevenue, "en") : "—"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="Total Tax" value={data ? formatCurrency(data.totalTax, "en") : "—"} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Total Collected"
              value={data ? formatCurrency(data.totalCollected, "en") : "—"}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
