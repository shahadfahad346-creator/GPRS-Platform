import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { FileText, Users, BookOpen, AlertTriangle, Sparkles, Download, X, Percent, Calendar, Building2, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Zap, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface IdeaDetailModalProps {
  idea: any;
  isOpen: boolean;
  onClose: () => void;
}

export function IdeaDetailModal({ idea, isOpen, onClose }: IdeaDetailModalProps) {
  
 const exportToPDF = async () => {
  try {
    const element = document.getElementById('pdf-content');
    if (!element) {
      toast.error('المحتوى غير موجود');
      return;
    }

    toast.loading('جاري التحضير...', { duration: 0 });

    // === 1. توسيع المحتوى + إخفاء الأقسام المطلوبة ===
    const dialogContent = element.parentElement;
    const originalDialogStyle = dialogContent?.style.cssText || '';
    const originalElementStyle = element.style.cssText;

    if (dialogContent) {
      dialogContent.style.maxHeight = 'none';
      dialogContent.style.height = 'auto';
      dialogContent.style.overflow = 'visible';
    }
    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';

    // === 2. إخفاء الأقسام المطلوبة ===
    const sectionsToHide = [
      '[data-section="executive-summary"]',
      '[data-section="supervisors"]',
      '[data-section="technical-readiness"]'
    ];
    const hiddenElements: HTMLElement[] = [];

    sectionsToHide.forEach(selector => {
      const el = element.querySelector(selector) as HTMLElement;
      if (el) {
        hiddenElements.push(el);
        el.style.display = 'none';
      }
    });

    // === 3. انتظار إعادة الرسم ===
    await new Promise(r => setTimeout(r, 150));
    element.scrollTop = 0;

    // === 4. نسخة للتصدير ===
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '780px';
    clone.style.padding = '40px';
    clone.style.background = '#fff';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.fontSize = '13px';
    clone.style.lineHeight = '1.5';
    document.body.appendChild(clone);

    // حذف العناصر الثقيلة
    clone.querySelectorAll('button, svg, img').forEach(el => el.remove());

    // تطبيق الألوان
    const all = clone.querySelectorAll('*');
    all.forEach((el: any) => {
      const s = window.getComputedStyle(el);
      el.style.color = s.color.includes('oklch') ? '#374151' : s.color;
      el.style.backgroundColor = s.backgroundColor.includes('oklch') ? '#fff' : s.backgroundColor;
      el.style.borderColor = s.borderColor.includes('oklch') ? '#d1d5db' : s.borderColor;
      el.style.fontFamily = 'system-ui, sans-serif';
    });

    // === 5. التقاط الصورة ===
    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#fff',
      windowWidth: 900,
      windowHeight: clone.scrollHeight + 300,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: false,
    });

    // === 6. إرجاع كل شيء زي ما كان ===
    if (dialogContent) dialogContent.style.cssText = originalDialogStyle;
    element.style.cssText = originalElementStyle;
    hiddenElements.forEach(el => el.style.display = '');
    document.body.removeChild(clone);
    toast.dismiss();

    // === 7. إنشاء PDF ===
    const img = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(img, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      pdf.addPage();
      position = heightLeft - imgHeight;
      pdf.addImage(img, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const title = (idea.stage_1_initial_analysis?.Project_Title || idea.title || 'تقرير')
      .replace(/[^\u0600-\u06FF\w\s]/g, ' ')
      .trim()
      .slice(0, 50);
    pdf.save(`${title}.pdf`);

    toast.success('تم التصدير بنجاح!');

  } catch (error) {
    console.error('Export failed:', error);
    toast.dismiss();
    toast.error('فشل التصدير');
  }
};

  const exportToImage = async () => {
    try {
      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('Content element not found');
      }

      toast.info('Preparing image export...');

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '800px';
      clone.style.padding = '40px';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(el);
        
        htmlEl.style.backgroundColor = computedStyle.backgroundColor;
        htmlEl.style.color = computedStyle.color;
        htmlEl.style.borderColor = computedStyle.borderColor;
        htmlEl.style.borderWidth = computedStyle.borderWidth;
        htmlEl.style.borderStyle = computedStyle.borderStyle;
        htmlEl.style.fontFamily = computedStyle.fontFamily;
        htmlEl.style.fontSize = computedStyle.fontSize;
        htmlEl.style.fontWeight = computedStyle.fontWeight;
      });

      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 880,
        windowHeight: clone.scrollHeight,
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = `${idea.stage_1_initial_analysis?.Project_Title || idea.title || 'idea'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success('Image exported successfully');

    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Failed to export image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] h-full bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-gray-900 text-xl">
              {idea.stage_1_initial_analysis?.Project_Title || idea.title || 'Untitled Idea'}
            </DialogTitle>
            <div className="flex gap-2">
              <Button onClick={exportToPDF} style={{ backgroundColor: '#059669', color: '#ffffff' }} className="hover:opacity-90">
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div 
          id="pdf-content" 
          className="space-y-5 py-4 overflow-y-auto max-h-[calc(85vh-100px)]" 
          style={{ 
            backgroundColor: '#ffffff', 
            fontFamily: 'system-ui, -apple-system, sans-serif', 
            color: '#374151' 
          }}
        >
          
          {/* Description */}
          <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
            <CardContent className="pt-5">
              <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                <FileText className="w-4 h-4" style={{ color: '#6B7280' }} />
                Description
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: '#4B5563' }}>
                {idea.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

         

          {/* Domain */}
          {idea.stage_1_initial_analysis?.Domain && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <FileText className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Domain
                </h3>
                <p className="mb-2 text-sm" style={{ color: '#4B5563' }}>
                  <span style={{ fontWeight: '500' }}>General:</span> {idea.stage_1_initial_analysis.Domain.General_Domain || 'General'}
                </p>
                <p className="text-sm" style={{ color: '#4B5563' }}>
                  <span style={{ fontWeight: '500' }}>Technical:</span> {idea.stage_1_initial_analysis.Domain.Technical_Domain || 'Technical'}
                </p>
              </CardContent>
            </Card>
          )}
        
          

          {/* SWOT Analysis */}
          {idea.stage_1_initial_analysis?.SWOT_Analysis && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#6B7280' }} />
                  SWOT Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-sm" style={{ color: '#111827', fontWeight: '500' }}>Strengths:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#4B5563' }}>
                      {idea.stage_1_initial_analysis.SWOT_Analysis.Strengths?.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm" style={{ color: '#111827', fontWeight: '500' }}>Weaknesses:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#4B5563' }}>
                      {idea.stage_1_initial_analysis.SWOT_Analysis.Weaknesses?.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm" style={{ color: '#111827', fontWeight: '500' }}>Opportunities:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#4B5563' }}>
                      {idea.stage_1_initial_analysis.SWOT_Analysis.Opportunities?.map((o: string, i: number) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm" style={{ color: '#111827', fontWeight: '500' }}>Threats:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: '#4B5563' }}>
                      {idea.stage_1_initial_analysis.SWOT_Analysis.Threats?.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Audience */}
          {idea.stage_1_initial_analysis?.Target_Audience && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <Users className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Target Audience
                </h3>
                <p className="mb-2 text-sm" style={{ color: '#4B5563' }}>
                  <span style={{ fontWeight: '500' }}>Primary:</span> {idea.stage_1_initial_analysis.Target_Audience.Primary?.join(', ') || 'None'}
                </p>
                <p className="text-sm" style={{ color: '#4B5563' }}>
                  <span style={{ fontWeight: '500' }}>Secondary:</span> {idea.stage_1_initial_analysis.Target_Audience.Secondary?.join(', ') || 'None'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          {idea.stage_1_initial_analysis?.Executive_Summary && (
            <Card data-section="executive-summary" style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <FileText className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Executive Summary
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: '#4B5563' }}>
                  {idea.stage_1_initial_analysis.Executive_Summary}
                </p>
              </CardContent>
            </Card>
            </Card>
          )}
           {/* Recommended Supervisors */}
          {idea.stage_2_extended_analysis?.Supervisors?.length > 0 && (
            <Card data-section="supervisors" style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <Users className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Recommended Supervisors
                </h3>
                <ul className="space-y-3">
                  {idea.stage_2_extended_analysis.Supervisors.map((supervisor: any, i: number) => (
                    <li 
                      key={i} 
                      className="pb-2 text-sm" 
                      style={{ 
                        color: '#4B5563', 
                        borderBottom: i < idea.stage_2_extended_analysis.Supervisors.length - 1 ? '1px solid #E5E7EB' : 'none' 
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{supervisor.Name}</span> ({supervisor.Department})
                      <br />
                      <span className="text-sm" style={{ color: '#2563EB' }}>{supervisor.Email}</span>
                      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{supervisor.Justification}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            </Card>
          )}
          {/* Technical Readiness Assessment */}
          {idea.stage_1_initial_analysis?.Required_Skills?.Skills?.length > 0 && (() => {
            const allSkills = idea.stage_1_initial_analysis.Required_Skills.Skills || [];
            const matchedSkills = idea.stage_1_initial_analysis.Required_Skills.Matches || [];
            const gapSkills = idea.stage_1_initial_analysis.Required_Skills.Gaps || [];
            const matchPercentage = idea.stage_1_initial_analysis.Required_Skills.Match_Percentage ||
              (allSkills.length > 0 ? (matchedSkills.length / allSkills.length) * 100 : 0);

            const getReadinessStatus = (percentage: number) => {
              if (percentage >= 80) return { label: 'Excellent Readiness', color: '#059669', bg: '#F0FDF4' };
              if (percentage >= 60) return { label: 'Good Preparation', color: '#2563EB', bg: '#EFF6FF' };
              if (percentage >= 40) return { label: 'Learning Required', color: '#D97706', bg: '#FFFBEB' };
              return { label: 'High Learning Curve', color: '#DC2626', bg: '#FEF2F2' };
            };

            const status = getReadinessStatus(matchPercentage);

            return (
              <div data-section="technical-readiness" className="border rounded-lg p-5 bg-white" style={{ borderWidth: '1px', borderColor: '#D1D5DB' }}>
              <div className="border rounded-lg p-5 bg-white" style={{ borderWidth: '1px', borderColor: '#D1D5DB' }}>
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <h3 className="text-base flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                    <Zap className="w-4 h-4" style={{ color: '#6B7280' }} />
                    Technical Readiness Assessment
                  </h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: status.bg }}>
                      <span className="text-lg" style={{ color: status.color, fontWeight: '500' }}>
                        {matchPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: status.color, fontWeight: '500' }}>{status.label}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {matchedSkills.length} of {allSkills.length} skills available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                    <div
                      className="h-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${matchPercentage}%`,
                        backgroundColor: matchPercentage >= 80 ? '#059669' : matchPercentage >= 60 ? '#2563EB' : matchPercentage >= 40 ? '#D97706' : '#DC2626'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {matchedSkills.length > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#374151' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                        <span style={{ fontWeight: '500' }}>Available Skills ({matchedSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs rounded-full"
                            style={{ color: '#065F46', backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {gapSkills.length > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#374151' }}>
                        <XCircle className="w-4 h-4" style={{ color: '#DC2626' }} />
                        <span style={{ fontWeight: '500' }}>Skills to Learn ({gapSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gapSkills.map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs rounded-full"
                            style={{ color: '#991B1B', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#374151' }}>
                    <Info className="w-4 h-4" style={{ color: '#6B7280' }} />
                    <span style={{ fontWeight: '500' }}>All Required Skills ({allSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill: string, i: number) => {
                      const isMatched = matchedSkills.includes(skill);
                      return (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs rounded-full"
                          style={isMatched 
                            ? { color: '#065F46', backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }
                            : { color: '#991B1B', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }
                          }
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* مربع منصات التعليم الموصى بها - لتفاصيل الفكرة */}
{gapSkills.length > 0 && (
  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
    <div className="flex items-center gap-2 mb-4">
      <BookOpen className="w-6 h-6 text-blue-700" />
      <h4 className="font-semibold text-lg text-slate-800">
        منصات تعليمية موصى بها
      </h4>
    </div>
    <p className="text-sm text-slate-600 mb-4">
      يمكنك تعلم المهارات الناقصة من خلال هذه المنصات التعليمية الموثوقة:
    </p>

    {/* المنصات العربية */}
    <div className="mb-5">
      <h5 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
        <span className="text-lg">Saudi Arabia Flag</span>
        منصات عربية
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <a href="https://tuwaiq.edu.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">أكاديمية طويق</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://maharattech.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">مهارات من Google</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://academy.hsoub.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">أكاديمية حسوب</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.rwaq.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">رواق</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.edraak.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">إدراك</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
        <a href="https://www.doroob.sa/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-emerald-700">دروب</span>
          <ExternalLink className="w-4 h-4 text-emerald-600" />
        </a>
      </div>
    </div>

    {/* المنصات العالمية */}
    <div>
      <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
        <span className="text-lg">World</span>
        منصات عالمية
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <a href="https://www.coursera.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Coursera</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.udemy.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Udemy</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.edx.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">edX</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.khanacademy.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Khan Academy</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.linkedin.com/learning/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">LinkedIn Learning</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
        <a href="https://www.udacity.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group">
          <span className="font-medium text-slate-700 group-hover:text-blue-700">Udacity</span>
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </a>
      </div>
    </div>

    <div className="mt-4 bg-blue-100/50 rounded-lg p-3 border border-blue-300">
      <p className="text-sm text-blue-900">
        Tip: <strong>نصيحة:</strong> ابدأ بالمنصات العربية للمفاهيم الأساسية، ثم انتقل للمنصات العالمية للتخصص المتقدم.
      </p>
    </div>
  </div>
)}
              </div>
              </div>
            );
          })()}

          {/* Similar Projects */}
          {idea.similar_projects?.length > 0 && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-4 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <BookOpen className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Similar Projects
                </h3>

                <ul className="space-y-4">
                  {idea.similar_projects.map((qdrantProject: any, i: number) => {
                    const qTitle = (qdrantProject.title || "").trim().toLowerCase().replace(/[^\w\s]/g, '');
                    const qYear = qdrantProject.year;
                    const qDept = (qdrantProject.department || "").trim().toLowerCase();

                    const geminiProject = idea.stage_2_extended_analysis?.Similar_Projects?.find((p: any) => {
                      const gTitle = (p.Title || "").trim().toLowerCase().replace(/[^\w\s]/g, '');
                      const gYear = p.Year;
                      const gDept = (p.Department || "").trim().toLowerCase();

                      const qWords = qTitle.split(" ").filter((w: string) => w.length > 2);
                      const gWords = gTitle.split(" ").filter((w: string) => w.length > 2);
                      const commonWords = qWords.filter((w: string) => gWords.includes(w));
                      const wordMatch = commonWords.length >= 2;

                      const yearMatch = !gYear || !qYear || gYear == qYear;
                      const deptMatch = !gDept || !qDept || gDept.includes(qDept) || qDept.includes(gDept);

                      return wordMatch && yearMatch && deptMatch;
                    });

                    const relevance = geminiProject?.Relevance ||
                                     idea.stage_2_extended_analysis?.Similar_Projects?.[i]?.Relevance ||
                                     "No analytical evaluation available.";

                    const similarityPercent = (qdrantProject.similarity_score * 100).toFixed(1);

                    return (
                      <li key={i} className="pb-4 last:border-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <h4 className="text-base mb-2" style={{ color: '#111827', fontWeight: '500' }}>
                          {qdrantProject.title || "Untitled"}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2" style={{ color: '#6B7280' }}>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{qdrantProject.department || "Undefined"}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{qdrantProject.year || "Undefined"}</span>
                          </div>

                          <div className="flex items-center gap-1" style={{ fontWeight: '500' }}>
                            <Percent className="w-3 h-3" />
                            <span>{similarityPercent}%</span>
                          </div>
                        </div>

                        <p className="text-sm italic leading-relaxed whitespace-pre-line" style={{ color: '#4B5563' }}>
                          {relevance}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggested Improvements */}
          {idea.stage_2_extended_analysis?.Improvements?.length > 0 && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <Sparkles className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Suggested Improvements
                </h3>
                <ul className="space-y-3">
                  {idea.stage_2_extended_analysis.Improvements.map((imp: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span 
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs" 
                        style={{ backgroundColor: '#E5E7EB', color: '#374151', fontWeight: '500' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{imp}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Final Proposal Summary */}
          {idea.stage_2_extended_analysis?.Final_Proposal?.Summary && (
            <Card style={{ borderWidth: '1px', borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' }}>
              <CardContent className="pt-5">
                <h3 className="text-base mb-3 flex items-center gap-2" style={{ color: '#111827', fontWeight: '500' }}>
                  <Sparkles className="w-4 h-4" style={{ color: '#6B7280' }} />
                  Final Proposal Summary
                </h3>
                <p className="leading-relaxed whitespace-pre-wrap text-sm" style={{ color: '#4B5563' }}>
                  {idea.stage_2_extended_analysis.Final_Proposal.Summary}
                </p>
              </CardContent>
            </Card>
          )}
          
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IdeaDetailModal;