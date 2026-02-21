import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/ui/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <GlassCard className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-purple-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent" data-testid="text-404-title">
                404
              </h1>
              <p className="text-base text-muted-foreground">
                You've screamed into a void that doesn't exist.
              </p>
            </div>

            <Link href="/">
              <Button className="gap-2" data-testid="link-home">
                <ArrowLeft className="w-4 h-4" />
                Return to Reality
              </Button>
            </Link>
          </motion.div>
        </GlassCard>
      </div>
    </Layout>
  );
}
