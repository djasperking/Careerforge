import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { CVContent, CvTemplateConfig } from "./schema";

/**
 * Server-side PDF rendering for CV export, mirroring the on-screen preview's
 * section order and column layout. Pure @react-pdf/renderer — no headless
 * browser required.
 */

Font.registerHyphenationCallback((word) => [word]);

const SPACING = { compact: 6, comfortable: 10, spacious: 14 } as const;

function styles(spacing: keyof typeof SPACING) {
  const gap = SPACING[spacing];
  return StyleSheet.create({
    page: { padding: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#171717", lineHeight: 1.4 },
    name: { fontSize: 19, fontFamily: "Helvetica-Bold" },
    headline: { fontSize: 10, color: "#525252", marginTop: 2 },
    contact: { fontSize: 8.5, color: "#737373", marginTop: 6 },
    hr: { borderBottomWidth: 1, borderBottomColor: "#e5e5e5", marginTop: 10, marginBottom: gap },
    row: { flexDirection: "row" },
    col: { flexGrow: 1 },
    sidebar: { width: "32%", marginLeft: 20 },
    section: { marginBottom: gap },
    h2: {
      fontSize: 8.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase",
      letterSpacing: 0.6, color: "#404040", borderBottomWidth: 0.5, borderBottomColor: "#d4d4d4",
      paddingBottom: 2, marginBottom: 4,
    },
    itemHeadRow: { flexDirection: "row", justifyContent: "space-between" },
    bold: { fontFamily: "Helvetica-Bold" },
    muted: { color: "#737373", fontSize: 8.5 },
    bullet: { flexDirection: "row", marginTop: 1 },
    bulletDot: { width: 8 },
    bulletText: { flex: 1 },
    itemBlock: { marginBottom: 5 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap" },
    chip: {
      borderWidth: 0.5, borderColor: "#d4d4d4", borderRadius: 3, paddingVertical: 2,
      paddingHorizontal: 5, marginRight: 4, marginBottom: 4, fontSize: 8,
    },
    watermark: {
      position: "absolute", bottom: 16, left: 36, right: 36, textAlign: "center",
      fontSize: 7.5, color: "#a3a3a3",
    },
  });
}

const SIDEBAR_KEYS = new Set(["personalInfo", "skills", "languages", "certifications"]);

export function CvPdfDocument({
  content,
  template,
  watermark = false,
}: {
  content: CVContent;
  template: CvTemplateConfig;
  watermark?: boolean;
}) {
  const s = styles(template.spacing);
  const order = template.sectionOrder.filter((k) => k !== "personalInfo");
  const sidebar = template.columns === 2 ? order.filter((k) => SIDEBAR_KEYS.has(k)) : [];
  const main = template.columns === 2 ? order.filter((k) => !SIDEBAR_KEYS.has(k)) : order;
  const p = content.personalInfo;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("   ·   ");

  return (
    <Document title={p.fullName ? `${p.fullName} — CV` : "CV"} author="Career Forge">
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{p.fullName || "Your Name"}</Text>
        {p.headline ? <Text style={s.headline}>{p.headline}</Text> : null}
        {contact ? <Text style={s.contact}>{contact}</Text> : null}
        <View style={s.hr} />

        <View style={s.row}>
          <View style={s.col}>{main.map((k) => renderSection(k, content, s))}</View>
          {template.columns === 2 ? (
            <View style={s.sidebar}>{sidebar.map((k) => renderSection(k, content, s))}</View>
          ) : null}
        </View>

        {watermark ? (
          <Text style={s.watermark} fixed>
            Made with Career Forge — careerforge.com.ng
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}

function renderSection(key: string, c: CVContent, s: ReturnType<typeof styles>) {
  switch (key) {
    case "professionalSummary":
      return c.professionalSummary ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Professional Summary</Text>
          <Text>{c.professionalSummary}</Text>
        </View>
      ) : null;
    case "careerObjective":
      return c.careerObjective ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Career Objective</Text>
          <Text>{c.careerObjective}</Text>
        </View>
      ) : null;
    case "experience":
      return c.experience.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Work Experience</Text>
          {c.experience.map((e) => (
            <View style={s.itemBlock} key={e.id}>
              <View style={s.itemHeadRow}>
                <Text style={s.bold}>{[e.title, e.company].filter(Boolean).join(" · ")}</Text>
                <Text style={s.muted}>{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" — ")}</Text>
              </View>
              {e.location ? <Text style={s.muted}>{e.location}</Text> : null}
              {e.bullets.map((b, i) => (
                <View style={s.bullet} key={i}>
                  <Text style={s.bulletDot}>{"•"}</Text>
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null;
    case "education":
      return c.education.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Education</Text>
          {c.education.map((e) => (
            <View style={s.itemBlock} key={e.id}>
              <View style={s.itemHeadRow}>
                <Text style={s.bold}>{[e.degree, e.field].filter(Boolean).join(", ")}</Text>
                <Text style={s.muted}>{[e.startDate, e.endDate].filter(Boolean).join(" — ")}</Text>
              </View>
              <Text style={s.muted}>{e.institution}</Text>
              {e.description ? <Text>{e.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null;
    case "skills":
      return c.skills.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Skills</Text>
          <View style={s.chipsRow}>
            {c.skills.map((sk) => (
              <Text style={s.chip} key={sk}>{sk}</Text>
            ))}
          </View>
        </View>
      ) : null;
    case "certifications":
      return c.certifications.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Certifications</Text>
          {c.certifications.map((cert) => (
            <View style={s.itemBlock} key={cert.id}>
              <Text style={s.bold}>{cert.name}</Text>
              <Text style={s.muted}>{[cert.issuer, cert.issueDate].filter(Boolean).join(" · ")}</Text>
            </View>
          ))}
        </View>
      ) : null;
    case "projects":
      return c.projects.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Projects</Text>
          {c.projects.map((pr) => (
            <View style={s.itemBlock} key={pr.id}>
              <Text style={s.bold}>{pr.name}</Text>
              {pr.description ? <Text>{pr.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null;
    case "achievements":
      return c.achievements.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Achievements</Text>
          {c.achievements.map((a, i) => (
            <View style={s.bullet} key={i}>
              <Text style={s.bulletDot}>{"•"}</Text>
              <Text style={s.bulletText}>{a}</Text>
            </View>
          ))}
        </View>
      ) : null;
    case "languages":
      return c.languages.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Languages</Text>
          {c.languages.map((l) => (
            <Text key={l.id}>{l.name}{l.proficiency ? ` — ${l.proficiency}` : ""}</Text>
          ))}
        </View>
      ) : null;
    case "volunteerExperience":
      return c.volunteerExperience.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Volunteer Experience</Text>
          {c.volunteerExperience.map((v) => (
            <View style={s.itemBlock} key={v.id}>
              <Text style={s.bold}>{[v.role, v.organization].filter(Boolean).join(" · ")}</Text>
              <Text style={s.muted}>{[v.startDate, v.endDate].filter(Boolean).join(" — ")}</Text>
              {v.description ? <Text>{v.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null;
    case "references":
      return c.references.length ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>References</Text>
          {c.references.map((r) => (
            <View style={s.itemBlock} key={r.id}>
              <Text style={s.bold}>{r.name}</Text>
              <Text style={s.muted}>{[r.relationship, r.contact].filter(Boolean).join(" · ")}</Text>
            </View>
          ))}
        </View>
      ) : null;
    case "additionalInformation":
      return c.additionalInformation ? (
        <View style={s.section} key={key}>
          <Text style={s.h2}>Additional Information</Text>
          <Text>{c.additionalInformation}</Text>
        </View>
      ) : null;
    default:
      return null;
  }
}
