"use client";

import { Card, Col, Flex, Progress, Row, Statistic, Typography } from "antd";
import type { ReactNode } from "react";

const { Text, Title } = Typography;

export type DistributorStat = {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
};

export type DistributorCommandStat = {
  label: string;
  value: number | string;
};

export type DistributorStatusItem = {
  label: string;
  value: number | string;
  icon: ReactNode;
};

export function DistributorPageShell({
  eyebrow,
  title,
  description,
  stats = [],
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: DistributorStat[];
  children: ReactNode;
}) {
  return (
    <Flex vertical gap={18} className="distributor-page-stack">
      <section className="distributor-page-hero">
        <div className="distributor-page-hero-copy">
          <Text className="distributor-page-eyebrow">{eyebrow}</Text>
          <Title level={2} className="distributor-page-title">
            {title}
          </Title>
          <Text type="secondary" className="distributor-page-description">
            {description}
          </Text>
        </div>
      </section>

      {stats.length > 0 && (
        <Row gutter={[14, 14]}>
          {stats.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card className="distributor-stat-card">
                <Flex align="center" gap={13}>
                  <span className="distributor-stat-icon">{item.icon}</span>
                  <Statistic title={item.title} value={item.value} />
                </Flex>
                {item.description && (
                  <Text className="distributor-stat-description">
                    {item.description}
                  </Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {children}
    </Flex>
  );
}

export function DistributorTableCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className="distributor-panel-card distributor-table-card"
      title={
        <Flex vertical gap={2}>
          <Text strong className="distributor-table-card-title">
            {title}
          </Text>
          {description && (
            <Text className="distributor-table-card-description">
              {description}
            </Text>
          )}
        </Flex>
      }
    >
      {children}
    </Card>
  );
}

export function DistributorCommandCenter({
  eyebrow,
  title,
  description,
  meterValue,
  meterLabel,
  stats,
  progressLabel,
  progressValue,
  progressPercent,
  feature,
  statusItems = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  meterValue: number | string;
  meterLabel: string;
  stats: DistributorCommandStat[];
  progressLabel: string;
  progressValue: string;
  progressPercent: number;
  feature?: ReactNode;
  statusItems?: DistributorStatusItem[];
}) {
  return (
    <Card
      variant="borderless"
      className="distributor-command-card"
      styles={{ body: { padding: 0 } }}
    >
      <Row gutter={0}>
        <Col xs={24} lg={9}>
          <div className="distributor-command-dark">
            <Text className="distributor-command-eyebrow">{eyebrow}</Text>
            <div className="distributor-command-title">{title}</div>
            <Text className="distributor-command-description">{description}</Text>

            <div className="distributor-command-meter">
              <span>{meterValue}</span>
              <label>{meterLabel}</label>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={15}>
          <div className="distributor-command-summary">
            <div className="distributor-command-content">
              <div>
                <Flex gap={14} wrap="wrap">
                  {stats.map((item) => (
                    <div className="distributor-command-stat" key={item.label}>
                      <span>{item.value}</span>
                      <label>{item.label}</label>
                    </div>
                  ))}
                </Flex>

                <div className="distributor-command-progress">
                  <Flex justify="space-between" align="center" gap={12}>
                    <Text className="distributor-command-progress-label">
                      {progressLabel}
                    </Text>
                    <Text className="distributor-command-progress-value">
                      {progressValue}
                    </Text>
                  </Flex>
                  <Progress
                    percent={progressPercent}
                    strokeColor="#0d9488"
                    trailColor="#d9eee9"
                    showInfo={false}
                  />
                </div>
              </div>

              {feature && <div className="distributor-command-feature">{feature}</div>}
            </div>

            {statusItems.length > 0 && (
              <div className="distributor-command-status-grid">
                {statusItems.map((item) => (
                  <div key={item.label}>
                    {item.icon}
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
}
