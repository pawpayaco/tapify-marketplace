import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export default function PrivacyPolicies() {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('pawpayaco@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 3000);
  };
  const policyDocuments = [
    // Privacy Policy
    {
      category: "Privacy Policy",
      description: "Our comprehensive privacy policy outlining how we collect, use, and protect your information",
      documents: [
        { name: "Pawpaya Privacy Policy", file: "Pawpaya_Privacy_Policy.pdf", description: "Complete privacy policy and data practices" },
      ]
    },
    // Core Security Policies
    {
      category: "Core Security Policies",
      description: "Our foundational security framework and practices",
      documents: [
        { name: "Information Security Policy", file: "Tapify_Information_Security_Policy.pdf", description: "Comprehensive security framework and standards" },
        { name: "Security Overview", file: "Tapify_Security_Overview.pdf", description: "High-level overview of our security practices" },
        { name: "Security Incident Response Policy", file: "Security_Incident_Response_Policy.pdf", description: "How we handle and respond to security incidents" },
      ]
    },
    // Data Protection & Consent
    {
      category: "Data Protection & Consent",
      description: "How we protect your data and respect your rights",
      documents: [
        { name: "Consumer Consent & Data Usage", file: "Q22_Consumer_Consent.pdf", description: "Your rights and how we use your data" },
      ]
    },
    // Access & Security Controls
    {
      category: "Access & Security Controls",
      description: "Protecting access to systems and data",
      documents: [
        { name: "Access Controls Policy", file: "Tapify_Access_Controls_Policy.pdf", description: "How we manage and control system access" },
        { name: "Vulnerability Management Policy", file: "vulnerability_management_policy.pdf", description: "Proactive security maintenance and patching" },
      ]
    },
    // Third-Party Management
    {
      category: "Third-Party Management",
      description: "Our approach to vendor security",
      documents: [
        { name: "Vendor Management Documentation", file: "Vendor_Management_Documentation.pdf", description: "How we ensure third-party security compliance" },
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
    <div className="min-h-screen bg-white pt-32 pb-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy & Security Policies</h1>
          <p className="text-xl text-gray-700 mb-6">
            Your security and privacy are our top priorities. Download our comprehensive policy documents below.
          </p>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-[23px] font-bold transition-all hover:bg-gray-50"
            >
              ← Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Policy Documents */}
      <div className="max-w-7xl mx-auto px-6">
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
              className="bg-white rounded-[23px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] p-8 border border-transparent"
            >
              {/* Category Header */}
              <div className="mb-6 pb-6 border-b-2 border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#ff7a4a] to-[#ff6fb3] rounded-[23px] flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{sectionIdx + 1}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.category}</h2>
                </div>
                <p className="text-gray-600 ml-13">{section.description}</p>
              </div>

              {/* Documents Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {section.documents.map((doc, docIdx) => (
                  <motion.a
                    key={docIdx}
                    href={`/Privacy/${doc.file}`}
                    download
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-start gap-4 p-5 rounded-[23px] border border-transparent hover:border-[#ff6fb3] hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 transition-all group"
                  >
                    {/* PDF Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-[23px] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#ff6fb3] transition-colors mb-2">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-600 leading-snug">{doc.description}</p>
                    </div>

                    {/* Download Icon */}
                    <div className="flex-shrink-0 mt-1">
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
          className="mt-16 bg-gradient-to-br from-[#fff3ea] to-[#fff6fb] rounded-[23px] p-10 text-center border-2 border-[#ff6fb3]/20 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            If you have any questions about our privacy and security policies, please don't hesitate to reach out to our team.
          </p>
          <motion.button
            onClick={copyEmailToClipboard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white px-8 py-4 rounded-[23px] font-bold shadow-lg hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all"
          >
            {emailCopied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Copied to Clipboard!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Privacy Team
              </>
            )}
          </motion.button>
          {emailCopied && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-gray-600"
            >
              pawpayaco@gmail.com
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

