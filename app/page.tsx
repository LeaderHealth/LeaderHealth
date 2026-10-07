import { HomePage } from "@/components/HomePage";
import { JsonLd } from "@/components/JsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/schema";

export default function Home() {
  return (
    <>
      <JsonLd data={[buildOrganizationSchema(), buildWebSiteSchema()]} />
      <HomePage />
    </>
  );
}
