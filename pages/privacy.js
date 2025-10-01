import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPolicies() {
  const policyDocuments = [
    // Security Policies
    {
      category: "Security Policies",
      documents: [
        { name: "Information Security Policy", file: "Tapify_Information_Security_Policy.pdf" },
        { name: "Security Overview", file: "Tapify_Security_Overview.pdf" },
        { name: "Security Policies Collection", file: "Tapify_Security_Policies.pdf" },
        { name: "Security Incident Response Policy", file: "Security_Incident_Response_Policy.pdf" },
        { name: "Security Awareness Training Policy", file: "Security_Awareness_Training_Policy.pdf" },
      ]
    },
    // Access & Authentication
    {
      category: "Access & Authentication",
      documents: [
        { name: "Access Controls Policy", file: "Tapify_Access_Controls_Policy.pdf" },
        { name: "Multi-Factor Authentication Policy", file: "MultiFactorAuthenticationPolicy.pdf" },
        { name: "2FA Documentation", file: "Q25_2FA_Documentation.pdf" },
      ]
    },
    // Data Privacy & Compliance
    {
      category: "Data Privacy & Compliance",
      documents: [
        { name: "Consumer Consent", file: "Q22_Consumer_Consent.pdf" },
        { name: "Data Minimization Documentation", file: "Q23_Data_Minimization_Documentation.pdf" },
        { name: "Data Minimization Policy", file: "Q23_Data_Minimization.pdf" },
        { name: "Data Usage Documentation", file: "Q24_Data_Usage_Documentation.pdf" },
      ]
    },
    // Network & Infrastructure
    {
      category: "Network & Infrastructure",
      documents: [
        { name: "Network Segmentation Policy", file: "Network_Segmentation_Policy.pdf" },
        { name: "Asset Management Policy", file: "Tapify_Asset_Management_Policy.pdf" },
        { name: "BYOD Policy", file: "Tapify_BYOD_Policy.pdf" },
      ]
    },
    // Monitoring & Logging
    {
      category: "Monitoring & Logging",
      documents: [
        { name: "Audit Trail and Logging Policy", file: "Audit_Trail_and_Logging_Policy.pdf" },
        { name: "Monitoring & Alerting Policy", file: "Monitoring_Alerting_Policy.pdf" },
        { name: "Logging & Monitoring Documentation", file: "Question_14_Logging_Monitoring.pdf" },
        { name: "Monitoring & Alerting Documentation", file: "Question_15_Monitoring_Alerting.pdf" },
      ]
    },
    // Development & Testing
    {
      category: "Development & Testing",
      documents: [
        { name: "Code Change Process Policy", file: "CodeChangeProcessPolicy.pdf" },
        { name: "Code Review Approval Policy", file: "CodeReviewApprovalPolicy.pdf" },
        { name: "Code Testing Policy", file: "CodeTestingPolicy.pdf" },
        { name: "Independent Testing Documentation", file: "Independent_Testing_Documentation.pdf" },
        { name: "Independent Testing (Q20)", file: "Q20_Independent_Testing_Documentation.pdf" },
      ]
    },
    // Vendor & Personnel Management
    {
      category: "Vendor & Personnel Management",
      documents: [
        { name: "Vendor Management Documentation", file: "Vendor_Management_Documentation.pdf" },
        { name: "Background Checks", file: "Q21_Background_Checks.pdf" },
      ]
    },
    // Vulnerability Management
    {
      category: "Vulnerability Management",
      documents: [
        { name: "Vulnerability Management Policy", file: "vulnerability_management_policy.pdf" },
      ]
    },
    // Security Questionnaires
    {
      category: "Security Questionnaires",
      documents: [
        { name: "Security Questionnaire Part 12", file: "security_questionnaire_part12.pdf" },
        { name: "Security Questionnaire Part 13", file: "security_questionnaire_part13.pdf" },
      ]
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white py-16 px-6 shadow-lg relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy & Security Policies</h1>
            <p className="text-xl text-white/90 mb-6">
              Your security and privacy are our top priorities. Download our comprehensive policy documents below.
            </p>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm"
              >
                ← Back to Home
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Policy Documents */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          {policyDocuments.map((section, sectionIdx) => (
            <motion.div 
              key={sectionIdx}
              variants={fadeInUp}
              className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{sectionIdx + 1}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.category}</h2>
              </div>

              {/* Documents Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.documents.map((doc, docIdx) => (
                  <motion.a
                    key={docIdx}
                    href={`/Privacy/${doc.file}`}
                    download
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-[#ff6fb3] hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 transition-all group"
                  >
                    {/* PDF Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    {/* Document Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-[#ff6fb3] transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF Document</p>
                    </div>

                    {/* Download Icon */}
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#ff6fb3] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] rounded-3xl p-10 text-center border-2 border-[#ff6fb3]/20 shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            If you have any questions about our privacy and security policies, please don't hesitate to reach out to our team.
          </p>
          <motion.a
            href="mailto:pawpayaco@gmail.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Contact Privacy Team
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}

