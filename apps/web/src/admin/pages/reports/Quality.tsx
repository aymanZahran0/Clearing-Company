import { Card, Col, Row, Statistic, Table } from "antd";
import { useGetQualityReportQuery } from "../../../api/reportsApi";

// T165 (US8)
export default function Quality() {
  const { data, isLoading } = useGetQualityReportQuery();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-4 text-xl font-semibold">Quality Report</h1>
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12}>
          <Card loading={isLoading}>
            <Statistic
              title="Average Rating"
              value={data?.averageRating != null ? data.averageRating.toFixed(2) : "—"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card loading={isLoading}>
            <Statistic title="Total Reviews" value={data?.reviewCount ?? 0} />
          </Card>
        </Col>
      </Row>
      <Table
        loading={isLoading}
        rowKey="status"
        dataSource={data?.issuesByStatus}
        pagination={false}
        columns={[
          { title: "Quality Issue Status", dataIndex: "status" },
          { title: "Count", dataIndex: "count" },
        ]}
      />
    </div>
  );
}
