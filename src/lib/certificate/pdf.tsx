import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Rect, G } from "@react-pdf/renderer";

const NAVY = "#1c2b53";
const GOLD = "#b08d3f";
const INK = "#2a2a2a";
const CREAM = "#fdfbf5";

const styles = StyleSheet.create({
  page: { backgroundColor: CREAM, fontFamily: "Times-Roman", position: "relative" },
  frame: { position: "absolute", top: 18, left: 18, right: 18, bottom: 18 },
  content: {
    position: "absolute", top: 60, left: 80, right: 80, bottom: 60,
    alignItems: "center", justifyContent: "flex-start",
  },
  brand: { fontFamily: "Times-Bold", fontSize: 13, letterSpacing: 5, color: NAVY, textTransform: "uppercase" },
  brandRule: { width: 90, height: 1, backgroundColor: GOLD, marginTop: 6, marginBottom: 22 },
  certWord: { fontFamily: "Times-Bold", fontSize: 44, letterSpacing: 8, color: NAVY, textTransform: "uppercase" },
  certSub: { fontFamily: "Times-Roman", fontSize: 13, letterSpacing: 6, color: GOLD, textTransform: "uppercase", marginTop: 4 },
  presented: { fontFamily: "Times-Roman", fontSize: 11, letterSpacing: 2, color: "#6b6b6b", textTransform: "uppercase", marginTop: 34 },
  name: { fontFamily: "Times-Italic", fontSize: 40, color: NAVY, marginTop: 10 },
  nameRule: { width: 340, height: 1, backgroundColor: GOLD, marginTop: 8, marginBottom: 20 },
  body: { fontFamily: "Times-Roman", fontSize: 12, color: INK, textAlign: "center", maxWidth: 460, lineHeight: 1.6 },
  course: { fontFamily: "Times-Bold", fontSize: 16, color: NAVY, textAlign: "center", marginTop: 8 },
  sigRow: {
    position: "absolute", left: 90, right: 90, bottom: 66,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  sigBlock: { alignItems: "center", width: 190 },
  sigMark: { fontFamily: "Times-Italic", fontSize: 20, color: NAVY, marginBottom: 4 },
  sigLine: { width: 170, height: 0.8, backgroundColor: "#9a9a9a", marginBottom: 4 },
  sigName: { fontFamily: "Times-Bold", fontSize: 10, color: INK },
  sigRole: { fontFamily: "Times-Roman", fontSize: 8, color: "#7a7a7a", letterSpacing: 1, textTransform: "uppercase", marginTop: 1 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center", fontFamily: "Times-Roman", fontSize: 7.5, color: "#9a9a9a", letterSpacing: 0.5 },
});

function Corner({ x, y, flipX, flipY }: { x: number; y: number; flipX?: boolean; flipY?: boolean }) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return (
    <G transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <Path d="M0 0 L54 0" stroke={GOLD} strokeWidth={1.4} />
      <Path d="M0 0 L0 54" stroke={GOLD} strokeWidth={1.4} />
      <Path d="M10 10 C 10 30, 30 10, 40 22" stroke={GOLD} strokeWidth={0.9} fill="none" />
      <Circle cx={10} cy={10} r={2.4} fill={GOLD} />
    </G>
  );
}

export function CertificatePdfDocument({
  studentName, title, issuerName, completionDate, publicId, verifyUrl, signatureName,
}: {
  studentName: string;
  title: string;
  issuerName: string;
  completionDate: Date;
  publicId: string;
  verifyUrl: string;
  signatureName?: string | null;
}) {
  const dateStr = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(completionDate);
  const instructor = signatureName || issuerName;

  return (
    <Document title={`Certificate — ${studentName}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative frame */}
        <Svg style={styles.frame} viewBox="0 0 806 560">
          <Rect x={0} y={0} width={806} height={560} stroke={NAVY} strokeWidth={4} fill="none" />
          <Rect x={10} y={10} width={786} height={540} stroke={GOLD} strokeWidth={1} fill="none" />
          <Corner x={26} y={26} />
          <Corner x={780} y={26} flipX />
          <Corner x={26} y={534} flipY />
          <Corner x={780} y={534} flipX flipY />
        </Svg>

        <View style={styles.content}>
          <Text style={styles.brand}>Career Forge</Text>
          <View style={styles.brandRule} />

          <Text style={styles.certWord}>Certificate</Text>
          <Text style={styles.certSub}>of Completion</Text>

          <Text style={styles.presented}>This certificate is proudly presented to</Text>
          <Text style={styles.name}>{studentName}</Text>
          <View style={styles.nameRule} />

          <Text style={styles.body}>has successfully completed the course</Text>
          <Text style={styles.course}>{title}</Text>
          <Text style={styles.body}>on {dateStr}</Text>
        </View>

        {/* Seal */}
        <Svg style={{ position: "absolute", bottom: 58, left: 373, width: 60, height: 60 }} viewBox="0 0 60 60">
          <Circle cx={30} cy={30} r={26} fill="none" stroke={GOLD} strokeWidth={2} />
          <Circle cx={30} cy={30} r={20} fill="none" stroke={GOLD} strokeWidth={0.8} />
          <Path d="M30 6 L34 14 L30 10 L26 14 Z" fill={GOLD} />
          <Path d="M30 54 L34 46 L30 50 L26 46 Z" fill={GOLD} />
          <Path d="M6 30 L14 34 L10 30 L14 26 Z" fill={GOLD} />
          <Path d="M54 30 L46 34 L50 30 L46 26 Z" fill={GOLD} />
        </Svg>
        <Text style={{ position: "absolute", bottom: 76, left: 373, width: 60, textAlign: "center", fontFamily: "Times-Bold", fontSize: 13, color: NAVY }}>CF</Text>

        <View style={styles.sigRow}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigMark}>{instructor}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{instructor}</Text>
            <Text style={styles.sigRole}>Instructor</Text>
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
