import type { ReactNode } from "react";
import WarehousePageTemplate, { type WarehouseIconType } from "@/app/warehouse/_components/WarehousePageTemplate";

export default function WarehousePageLoading({
  titleEn,
  titleTh,
  routePath,
  iconName,
  fullBleed = true,
  children,
}: {
  titleEn: string;
  titleTh: string;
  routePath: string;
  iconName?: WarehouseIconType;
  fullBleed?: boolean;
  children: ReactNode;
}) {
  return (
    <WarehousePageTemplate
      titleEn={titleEn}
      titleTh={titleTh}
      routePath={routePath}
      iconName={iconName}
      fullBleed={fullBleed}
      loading
    >
      {children}
    </WarehousePageTemplate>
  );
}
