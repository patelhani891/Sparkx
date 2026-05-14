import { motion, AnimatePresence } from "framer-motion";
import { Clock, Download, Trash2, X } from "lucide-react";

export interface HistoryItem {
  id: string;
  prompt: string;
  thumbnail: string;
  timestamp: number;
  poster: any;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onDownload: (item: HistoryItem) => void;
}

const HistoryPanel = ({ items, isOpen, onClose, onRestore, onDelete, onDownload }: HistoryPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0 }}
          className="fixed left-0 top-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-r border-border z-50 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-sm">History</h3>
                <p className="text-[10px] text-muted-foreground font-ui">{items.length} poster{items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <Clock className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground/60 font-ui">No posters yet</p>
                <p className="text-xs text-muted-foreground/40 font-ui mt-1">Generate your first poster to see it here</p>
              </div>
            )}
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-xl overflow-hidden bg-secondary/50 border border-border/50 hover:border-accent/30 transition-all cursor-pointer"
                onClick={() => onRestore(item)}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-ui text-foreground/90 line-clamp-1">{item.prompt}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-ui">
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(item); }}
                    className="h-7 w-7 rounded-lg bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="h-7 w-7 rounded-lg bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
