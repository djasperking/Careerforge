import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  border: {
    margin: 24,
    flex: 1,
    borderWidth: 2,
    borderColor: "#312e81",
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 12, letterSpacing: 2, color: "#4338ca", textTransform: "uppercase", marginBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 3, color: "#737373", textTransform: "uppercase" },
  title: { fontSize: 30, fontFamily: "Helvetica-Bold", color: "#171717", marginTop: 10 },
  name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#312e81", marginTop: 26, marginBottom: 10 },
  body: { fontSize: 12, color: "#404040", textAlign: "center", maxWidth: 420, lineHeight: 1.5 },
  courseTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#171717", marginTop: 6, marginBottom: 6 },
  footerRow: {
    position: "absolute", bottom: 40, left: 60, right: 60,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  footerBlock: { fontSize: 9, color: "#737373" },
  footerLabel: { fontSize: 8, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
});

export function CertificatePdfDocument({
  studentName, title, issuerName, completionDate, publicId, verifyUrl,
}: {
  studentName: string;
  title: string;
  issuerName: string;
  completionDate: Date;
  publicId: string;
  verifyUrl: string;
}) {
  const dateStr = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(completionDate);

  return (
    <Document title={`Certificate — ${studentName}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.brand}>Career Forge</Text>
          <Text style={styles.eyebrow}>Certificate of Completion</Text>
          <Text style={styles.title}>This certifies that</Text>
          <Text style={styles.name}>{studentName}</Text>
          <Text style={styles.body}>has successfully completed</Text>
          <Text style={styles.courseTitle}>{title}</Text>
          <Text style={styles.body}>Awarded on {dateStr}</Text>

          <View style={styles.footerRow}>
            <View style={styles.footerBlock}>
              <Text style={styles.footerLabel}>Certificate ID</Text>
              <Text>{publicId}</Text>
            </View>
            <View style={[styles.footerBlock, { textAlign: "center" }]}>
              <Text style={styles.footerLabel}>Issued by</Text>
              <Text>{issuerName}</Text>
            </View>
            <View style={[styles.footerBlock, { textAlign: "right" }]}>
              <Text style={styles.footerLabel}>Verify at</Text>
              <Text>{verifyUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
