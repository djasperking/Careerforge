import {
  Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Rect, Defs, LinearGradient, Stop,
} from "@react-pdf/renderer";

// Brand palette — matches the certificate cards on the website.
const VIOLET = "#4c1d95";
const FUCHSIA = "#be185d";
const ORANGE = "#f97316";
const GOLD = "#e0a82e";
const INK = "#1e1b3a";
const MUTED = "#6b6890";
const PAPER = "#fffdfa";

const W = 842; // A4 landscape, in points
const H = 595;

const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, fontFamily: "Helvetica", position: "relative" },
  bannerText: { position: "absolute", top: 0, left: 0, width: W, height: 190, alignItems: "center", paddingTop: 30 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 5, color: "#ffffff", marginLeft: 8, textTransform: "uppercase" },
  certWord: { fontFamily: "Helvetica-Bold", fontSize: 46, letterSpacing: 9, color: "#ffffff", marginTop: 16, textTransform: "uppercase" },
  certSub: { fontFamily: "Helvetica-Bold", fontSize: 13, letterSpacing: 7, color: "#fde68a", marginTop: 4, textTransform: "uppercase" },
  body: { position: "absolute", top: 212, left: 70, right: 70, alignItems: "center" },
  presented: { fontFamily: "Helvetica", fontSize: 10, letterSpacing: 3, color: MUTED, textTransform: "uppercase" },
  name: { fontFamily: "Times-BoldItalic", fontSize: 40, color: VIOLET, marginTop: 8 },
  nameRule: { width: 360, height: 2, backgroundColor: ORANGE, marginTop: 6, marginBottom: 14 },
  lead: { fontFamily: "Helvetica", fontSize: 11.5, color: INK, textAlign: "center" },
  course: { fontFamily: "Helvetica-Bold", fontSize: 19, color: INK, textAlign: "center", marginTop: 6, marginBottom: 6, maxWidth: 620 },
  covHead: { fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 3, color: FUCHSIA, textTransform: "uppercase", marginTop: 14, marginBottom: 7 },
  covRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 640 },
  pill: { backgroundColor: "#f3e8ff", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, margin: 3 },
  pillText: { fontFamily: "Helvetica", fontSize: 9, color: VIOLET },
  sigRow: { position: "absolute", left: 80, right: 80, bottom: 70, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sigBlock: { alignItems: "center", width: 200 },
  sigMark: { fontFamily: "Times-Italic", fontSize: 21, color: VIOLET, marginBottom: 4 },
  sigLine: { width: 180, height: 0.8, backgroundColor: "#b4b0cc", marginBottom: 5 },
  sigName: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: INK },
  sigRole: { fontFamily: "Helvetica", fontSize: 7.5, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", fontFamily: "Helvetica", fontSize: 8, color: MUTED },
});

export function CertificatePdfDocument({
  studentName, title, issuerName, completionDate, publicId, verifyUrl, signatureName, highlights = [],
}: {
  studentName: string;
  title: string;
  issuerName: string;
  completionDate: Date;
  publicId: string;
  verifyUrl: string;
  signatureName?: string | null;
  highlights?: string[];
}) {
  const dateStr = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(completionDate);
  // For official courses the instructor and the issuer are both Career Forge, so name the left signature the course team.
  const instructor = !signatureName || signatureName === issuerName ? "Career Forge Team" : signatureName;
  const instructorRole = instructor === "Career Forge Team" ? "Course Team" : "Instructor";

  return (
    <Document title={`Certificate — ${studentName}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Gradient banner, dotted texture and bottom strip */}
        <Svg style={{ position: "absolute", top: 0, left: 0, width: W, height: H }} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient id="band" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={VIOLET} />
              <Stop offset="0.55" stopColor={FUCHSIA} />
              <Stop offset="1" stopColor={ORANGE} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={190} fill="url(#band)" />
          <Circle cx={W - 30} cy={20} r={120} fill="#ffffff" opacity={0.08} />
          <Circle cx={40} cy={190} r={90} fill="#000000" opacity={0.08} />
          <Rect x={0} y={H - 10} width={W} height={10} fill="url(#band)" />
          <Rect x={22} y={206} width={W - 44} height={H - 242} rx={10} stroke={GOLD} strokeWidth={1} fill="none" />
        </Svg>

        <View style={styles.bannerText}>
          <View style={styles.brandRow}>
            <Svg width={26} height={26} viewBox="0 0 32 32">
              <Rect x={0} y={0} width={32} height={32} rx={7} fill="#ffffff" />
              <Path
                d="M16.3 8.3c.8 3.8 4.8 5.8 4.8 9.9a5.1 5.1 0 0 1-10.2 0c0-1.6.5-2.9 1.4-3.8.3 1.6 1.3 2.6 2.2 2.6-1.3-2.9 0-5.8 1.8-8.7Z"
                fill={FUCHSIA}
              />
              <Path
                d="M16.1 15c1.3 1.6 2.1 2.9 2.1 4.3a2.2 2.2 0 0 1-4.4 0c0-1 .5-1.8 1.3-2.5-.3 1 .3 1.6.8 1.6-.8-1.6-.3-3.2.2-4.8Z"
                fill="#ffffff"
              />
            </Svg>
            <Text style={styles.brand}>Career Forge</Text>
          </View>
          <Text style={styles.certWord}>Certificate</Text>
          <Text style={styles.certSub}>of Completion</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.presented}>Proudly awarded to</Text>
          <Text style={styles.name}>{studentName}</Text>
          <View style={styles.nameRule} />
          <Text style={styles.lead}>for successfully completing the course</Text>
          <Text style={styles.course}>{title}</Text>
          <Text style={styles.lead}>on {dateStr}</Text>

          {highlights.length ? (
            <>
              <Text style={styles.covHead}>Skills covered</Text>
              <View style={styles.covRow}>
                {highlights.map((h, i) => (
                  <View key={i} style={styles.pill}>
                    <Text style={styles.pillText}>{h}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* Seal */}
        <Svg style={{ position: "absolute", bottom: 62, left: W / 2 - 34, width: 68, height: 68 }} viewBox="0 0 68 68">
          <Circle cx={34} cy={34} r={31} fill={GOLD} />
          <Circle cx={34} cy={34} r={26} fill="none" stroke="#ffffff" strokeWidth={1.2} />
          <Circle cx={34} cy={34} r={22} fill={PAPER} />
        </Svg>
        <Text style={{ position: "absolute", bottom: 84, left: W / 2 - 34, width: 68, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 15, color: FUCHSIA }}>CF</Text>
        <Text style={{ position: "absolute", bottom: 72, left: W / 2 - 34, width: 68, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 5.5, letterSpacing: 1.5, color: MUTED }}>VERIFIED</Text>

        <View style={styles.sigRow}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigMark}>{instructor}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{instructor}</Text>
            <Text style={styles.sigRole}>{instructorRole}</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigMark}>Career Forge</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{issuerName}</Text>
            <Text style={styles.sigRole}>Issuing Authority</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Certificate ID {publicId}  ·  Verify at {verifyUrl}
        </Text>
      </Page>
    </Document>
  );
}
