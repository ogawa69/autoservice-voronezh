import { siteProfile } from "@/content/demo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span>{siteProfile.name}</span>
        <span>{siteProfile.address}</span>
        {siteProfile.mode === "demo" && (
          <span>Демонстрационный проект · контакты и отзывы вымышлены</span>
        )}
      </div>
    </footer>
  );
}
