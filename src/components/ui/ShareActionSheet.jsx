import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ShareActionSheet = ({ 
  isOpen = false, 
  onClose = () => {}, 
  shareData = {},
  className = '' 
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const formatShareText = () => {
    const { title, description, results, timestamp } = shareData;
    
    let shareText = `🌱 AI Tani Kupang - ${title}\n\n`;
    
    if (description) {
      shareText += `📝 ${description}\n\n`;
    }
    
    if (results && Array.isArray(results)) {
      shareText += `🔍 Hasil Diagnosis:\n`;
      results?.forEach((result, index) => {
        shareText += `${index + 1}. ${result?.name} (${result?.confidence}%)\n`;
      });
      shareText += '\n';
    }
    
    if (timestamp) {
      shareText += `📅 ${new Date(timestamp)?.toLocaleString('id-ID')}\n\n`;
    }
    
    shareText += `Dibuat dengan AI Tani Kupang 🚀`;
    
    return shareText;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(formatShareText());
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard?.writeText(formatShareText());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formatShareText();
      document.body?.appendChild(textArea);
      textArea?.select();
      document.execCommand('copy');
      document.body?.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData?.title || 'AI Tani Kupang',
          text: formatShareText(),
        });
        onClose();
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-300 transition-smooth"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Action Sheet */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-300
          bg-card rounded-t-lg border-t border-border
          transform transition-smooth
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 
              id="share-title"
              className="text-lg font-semibold text-foreground"
            >
              Bagikan Hasil
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-smooth"
              aria-label="Tutup"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          
          {/* Preview */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="text-sm text-foreground whitespace-pre-line max-h-32 overflow-y-auto">
              {formatShareText()}
            </div>
          </div>
          
          {/* Share Options */}
          <div className="space-y-3">
            {/* WhatsApp */}
            <Button
              variant="outline"
              fullWidth
              iconName="MessageCircle"
              iconPosition="left"
              onClick={handleWhatsAppShare}
              className="justify-start"
            >
              Bagikan ke WhatsApp
            </Button>
            
            {/* Native Share (if supported) */}
            {navigator.share && (
              <Button
                variant="outline"
                fullWidth
                iconName="Share"
                iconPosition="left"
                onClick={handleNativeShare}
                className="justify-start"
              >
                Bagikan ke Aplikasi Lain
              </Button>
            )}
            
            {/* Copy to Clipboard */}
            <Button
              variant="outline"
              fullWidth
              iconName={copySuccess ? "Check" : "Copy"}
              iconPosition="left"
              onClick={handleCopyToClipboard}
              className="justify-start"
            >
              {copySuccess ? 'Berhasil Disalin!' : 'Salin ke Clipboard'}
            </Button>
          </div>
          
          {/* Cancel */}
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
            >
              Batal
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareActionSheet;