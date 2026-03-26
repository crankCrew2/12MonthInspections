import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronRight, 
  FileText, 
  Download, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  Upload,
  Play,
  Signature,
  MapPin,
  Pencil,
  Trash2
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Project, Report, InspectionItem, INSPECTION_ITEMS, Attachment } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null);
  const [reports, setReports] = useState<Record<number, Report>>({});
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newSite, setNewSite] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReports(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  };

  const fetchReports = async (projectId: number) => {
    const res = await fetch(`/api/projects/${projectId}/reports`);
    const data = await res.json();
    const reportsMap: Record<number, Report> = {};
    data.forEach((r: any) => {
      reportsMap[r.item_id] = {
        ...r,
        attachments: r.attachments ? JSON.parse(r.attachments) : []
      };
    });
    setReports(reportsMap);
  };

  const handleCreateProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: newYear, site_location: newSite })
    });
    if (res.ok) {
      const project = await res.json();
      setProjects([project, ...projects]);
      setSelectedProject(project);
      setIsCreatingProject(false);
      setNewSite('');
    } else {
      alert('Project for this year already exists');
    }
  };

  const handleSaveReport = async (report: Report) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    if (res.ok) {
      setReports({ ...reports, [report.item_id]: report });
      alert('Report saved successfully');
    }
  };

  if (selectedItem && selectedProject) {
    return (
      <InspectionForm 
        item={selectedItem} 
        project={selectedProject}
        initialData={reports[selectedItem.id]}
        onBack={() => setSelectedItem(null)}
        onSave={handleSaveReport}
      />
    );
  }

  if (selectedProject) {
    return (
      <InspectionList 
        project={selectedProject}
        reports={reports}
        onSelectItem={setSelectedItem}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-indigo-900 mb-1">Electrical Inspections</h1>
            <p className="text-slate-500 font-medium">12-Month Maintenance Management</p>
          </div>
          <button 
            onClick={() => setIsCreatingProject(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="font-semibold">New Project</span>
          </button>
        </header>

        <AnimatePresence>
          {isCreatingProject && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Project</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Inspection Year</label>
                  <input 
                    type="number" 
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-2xl font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="2026"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Site Location</label>
                  <input 
                    type="text" 
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-2xl font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="e.g. Oaklands Junction"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={handleCreateProject}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Create Project
                  </button>
                  <button 
                    onClick={() => setIsCreatingProject(false)}
                    className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <motion.button
              key={project.id}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedProject(project)}
              className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] text-left transition-all shadow-sm hover:border-indigo-200"
            >
              <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ChevronRight size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Annual Cycle</span>
              <h3 className="text-5xl font-black text-slate-800 mb-4">{project.year}</h3>
              {project.site_location && (
                <p className="text-slate-400 font-bold text-sm mb-4 flex items-center gap-2">
                  <MapPin size={14} />
                  {project.site_location}
                </p>
              )}
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <FileText size={16} />
                <span>View Reports</span>
              </div>
            </motion.button>
          ))}
        </div>

        {projects.length === 0 && !isCreatingProject && (
          <div className="text-center py-32 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus size={40} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-400 text-xl">No inspection projects yet.</p>
            <p className="text-slate-300">Click "New Project" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InspectionList({ project, reports, onSelectItem, onBack }: { 
  project: Project, 
  reports: Record<number, Report>,
  onSelectItem: (item: InspectionItem) => void,
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 mb-8 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm uppercase tracking-wider"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </button>

        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-indigo-900 mb-2">{project.year} Cycle</h1>
            {project.site_location && (
              <p className="text-slate-500 font-bold flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-indigo-400" />
                {project.site_location}
              </p>
            )}
            <p className="text-slate-500 font-medium">Complete all 10 mandatory inspection items</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Progress</span>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500" 
                  style={{ width: `${(Object.keys(reports).length / INSPECTION_ITEMS.length) * 100}%` }}
                />
              </div>
              <span className="font-bold text-indigo-600">{Object.keys(reports).length}/10</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4">
          {INSPECTION_ITEMS.map((item) => {
            const report = reports[item.id];
            const isCompleted = !!report?.status;

            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={cn(
                  "w-full flex items-center justify-between p-6 bg-white border rounded-3xl text-left transition-all group shadow-sm",
                  isCompleted ? "border-emerald-100 hover:border-emerald-200" : "border-slate-200 hover:border-indigo-200"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors",
                    isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  )}>
                    {item.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-900 transition-colors">{item.title}</h3>
                    {item.description && <p className="text-xs text-slate-400 line-clamp-1 mt-1">{item.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isCompleted ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <span className="text-xl leading-none">{report.status === 'tick' ? '✔' : report.status === 'cross' ? '✘' : 'N/A'}</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Done</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-current" />
                      <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                    </div>
                  )}
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InspectionForm({ item, project, initialData, onBack, onSave }: {
  item: InspectionItem,
  project: Project,
  initialData?: Report,
  onBack: () => void,
  onSave: (report: Report) => void
}) {
  const [status, setStatus] = useState<Report['status']>(initialData?.status || null);
  const [comments, setComments] = useState(initialData?.comments || '');
  const [technician, setTechnician] = useState(initialData?.technician_name || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments ? (typeof initialData.attachments === 'string' ? JSON.parse(initialData.attachments) : initialData.attachments) : []);
  const [showEarthWizard, setShowEarthWizard] = useState(false);
  const [showMotorWizard, setShowMotorWizard] = useState(false);
  const [showPFCWizard, setShowPFCWizard] = useState(false);
  const [showOverloadWizard, setShowOverloadWizard] = useState(false);
  const [showSLDWizard, setShowSLDWizard] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData?.signature && sigCanvas.current) {
      sigCanvas.current.fromDataURL(initialData.signature);
    }
  }, [initialData]);

  const handleSave = () => {
    const signature = sigCanvas.current?.isEmpty() ? '' : sigCanvas.current?.getTrimmedCanvas().toDataURL();
    onSave({
      project_id: project.id,
      item_id: item.id,
      status,
      comments,
      technician_name: technician,
      date,
      signature: signature || '',
      attachments: JSON.stringify(attachments) as any
    });
  };

  const handleDownload = async () => {
    if (!formRef.current) return;
    
    const canvas = await html2canvas(formRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    for (const att of attachments) {
      if (att.type === 'application/pdf') {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text(`Attachment: ${att.name}`, 20, 30);
        pdf.setFontSize(10);
        pdf.text("Refer to the original uploaded file for full details.", 20, 40);
      }
    }
    
    pdf.save(`Inspection_${project.year}_Item_${item.id}.pdf`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments([...attachments, {
          name: file.name,
          type: file.type,
          data: event.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEarthTestComplete = (results: string) => {
    setComments(prev => prev ? `${prev}\n\n--- EARTH TEST RESULTS ---\n${results}` : `--- EARTH TEST RESULTS ---\n${results}`);
    setShowEarthWizard(false);
  };

  const handleMotorTestComplete = (results: string) => {
    setComments(prev => prev ? `${prev}\n\n${results}` : results);
    setShowMotorWizard(false);
  };

  const handlePFCTestComplete = (results: string) => {
    setComments(prev => prev ? `${prev}\n\n${results}` : results);
    setShowPFCWizard(false);
  };

  const handleOverloadTestComplete = (results: string) => {
    setComments(prev => prev ? `${prev}\n\n${results}` : results);
    setShowOverloadWizard(false);
  };

  const handleSLDTestComplete = (results: string) => {
    setComments(prev => prev ? `${prev}\n\n${results}` : results);
    setShowSLDWizard(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <AnimatePresence>
        {showEarthWizard && (
          <EarthTestWizard 
            project={project}
            onClose={() => setShowEarthWizard(false)} 
            onComplete={handleEarthTestComplete} 
          />
        )}
        {showMotorWizard && (
          <MotorTestWizard 
            project={project}
            onClose={() => setShowMotorWizard(false)} 
            onComplete={handleMotorTestComplete} 
          />
        )}
        {showPFCWizard && (
          <PFCWizard 
            project={project}
            onClose={() => setShowPFCWizard(false)} 
            onComplete={handlePFCTestComplete} 
          />
        )}
        {showOverloadWizard && (
          <OverloadWizard 
            project={project}
            onClose={() => setShowOverloadWizard(false)} 
            onComplete={handleOverloadTestComplete} 
          />
        )}
        {showSLDWizard && (
          <SLDWizard 
            project={project}
            onClose={() => setShowSLDWizard(false)} 
            onComplete={handleSLDTestComplete} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <ArrowLeft size={20} />
            <span>Back to List</span>
          </button>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleDownload}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-600 shadow-sm"
            >
              <Download size={18} />
              <span>PDF</span>
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold"
            >
              <Save size={18} />
              <span>Save Report</span>
            </button>
          </div>
        </div>

        <div ref={formRef} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          
          <header className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Item 0{item.id}</span>
                  <span className="text-slate-300 font-bold">/</span>
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Inspection Report</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 leading-tight mb-6">{item.title}</h1>
                {item.description && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-indigo-900 text-white p-8 rounded-[2rem] min-w-[160px] text-center shadow-xl shadow-indigo-100">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-2">Cycle Year</span>
                <span className="text-4xl font-black">{project.year}</span>
              </div>
            </div>
            
            {item.hardText && (
              <div className="flex items-center gap-3 text-indigo-600 font-black text-sm uppercase tracking-widest bg-indigo-50 w-fit px-6 py-3 rounded-2xl">
                <FileText size={18} />
                <span>{item.hardText}</span>
              </div>
            )}
          </header>

          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">1</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Compliance Status</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setStatus('tick')}
                  className={cn(
                    "flex items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all font-black text-lg",
                    status === 'tick' 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"
                  )}
                >
                  <span className="text-3xl leading-none">✔</span>
                  <span>Pass</span>
                </button>

                <button 
                  onClick={() => setStatus('cross')}
                  className={cn(
                    "flex items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all font-black text-lg",
                    status === 'cross' 
                      ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-600"
                  )}
                >
                  <span className="text-3xl leading-none">✘</span>
                  <span>Fail</span>
                </button>

                <button 
                  onClick={() => setStatus('na')}
                  className={cn(
                    "flex items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all font-black text-lg",
                    status === 'na' 
                      ? "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-100" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                  )}
                >
                  <span className="text-3xl leading-none">-</span>
                  <span>N/A</span>
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">2</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Observations & Comments</h3>
              </div>
              <textarea 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 p-8 rounded-[2rem] focus:outline-none focus:border-indigo-500 focus:bg-white transition-all min-h-[160px] font-medium text-slate-700"
                placeholder="Type your detailed notes here..."
              />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">3</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Technician</h3>
                </div>
                <input 
                  type="text" 
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-8 py-5 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="Enter your name"
                />
              </section>

              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">4</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Date of Inspection</h3>
                </div>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-8 py-5 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                />
              </section>
            </div>

            {(item.hasAttachment || item.hasConductTest) && (
              <section className="p-10 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">5</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Required Actions</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {item.hasAttachment && (
                    <div className="relative">
                      <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept=".pdf"
                      />
                      <label 
                        htmlFor="file-upload"
                        className="flex items-center gap-3 bg-white text-indigo-600 px-8 py-4 rounded-2xl cursor-pointer hover:bg-indigo-600 hover:text-white transition-all font-bold shadow-sm"
                      >
                        <Upload size={20} />
                        <span>{item.attachmentLabel || "Attach File"}</span>
                      </label>
                    </div>
                  )}
                  {item.hasConductTest && (
                    <button 
                      onClick={() => {
                        if (item.id === 3) setShowEarthWizard(true);
                        else if (item.id === 6) setShowMotorWizard(true);
                        else if (item.id === 5) setShowPFCWizard(true);
                        else if (item.id === 7) setShowOverloadWizard(true);
                        else if (item.id === 9) setShowSLDWizard(true);
                        else alert('Test sequence initiated. (Placeholder for future functionality)');
                      }}
                      className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100"
                    >
                      <Play size={20} />
                      <span>Conduct Testing</span>
                    </button>
                  )}
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-8 grid gap-3">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText size={20} />
                          </div>
                          <span className="font-bold text-slate-700">{att.name}</span>
                        </div>
                        <button 
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="text-rose-500 font-bold text-xs uppercase hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">6</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Digital Signature</h3>
              </div>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-2 overflow-hidden">
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#1e1b4b"
                  canvasProps={{
                    className: "w-full h-64 cursor-crosshair"
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-4 px-2">
                <p className="text-xs text-slate-400 font-medium italic">Sign inside the box above</p>
                <button 
                  onClick={() => sigCanvas.current?.clear()}
                  className="text-xs font-black uppercase tracking-widest text-rose-500 hover:underline"
                >
                  Clear Signature
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function EarthTestWizard({ onClose, onComplete, project }: { onClose: () => void, onComplete: (results: string) => void, project: Project }) {
  const [activeTab, setActiveTab] = useState<'main' | 'structural' | 'subcircuit'>('main');
  const [site, setSite] = useState(project.site_location || '');
  
  // Main Earth Register Data
  const [mainEarthStake, setMainEarthStake] = useState<any[]>([
    { id: 'TF1', loc: 'Isolation Transformer', electrode: 'Under TF1', result: '', date: '', comments: '' },
    { id: 'TF2', loc: 'Above MSB4', electrode: 'Under TF2', result: '', date: '', comments: '' },
    { id: 'TF2B', loc: 'Above MSB8', electrode: 'Under TF2B', result: '', date: '', comments: '' },
    { id: 'TF3', loc: 'Adjacent MCC3', electrode: 'Under TF3', result: '', date: '', comments: '' },
    { id: 'TF4', loc: 'Adjacent MCC2', electrode: 'Under TF4', result: '', date: '', comments: '' },
    { id: 'TF5', loc: 'Adjacent MCC1', electrode: 'Under TF5', result: '', date: '', comments: '' },
    { id: 'TF6', loc: 'South of Concrete Plant', electrode: 'Under TF6', result: '', date: '', comments: '' },
  ]);

  const [mainEarthConductor, setMainEarthConductor] = useState<any[]>([
    { id: 'TF1', loc: 'Isolation Transformer', men: 'Isolation Transformer', result: '', date: '', comments: '' },
    { id: 'TF2', loc: 'Above MSB4', men: 'Transformer Pole', result: '', date: '', comments: '' },
    { id: 'TF2B', loc: 'Above MSB8', men: 'Transformer Pole', result: '', date: '', comments: '' },
    { id: 'TF3', loc: 'Adjacent MCC3', men: 'Transformer Pole', result: '', date: '', comments: '' },
    { id: 'TF4', loc: 'Adjacent MCC2', men: 'Transformer Pole', result: '', date: '', comments: '' },
    { id: 'TF5', loc: 'Adjacent MCC1', men: 'MCC1', result: '', date: '', comments: '' },
    { id: 'TF6', loc: 'South of Concrete Plant', men: 'Under TF6', result: '', date: '', comments: '' },
  ]);

  // Structural Earth Data
  const [structuralEarth, setStructuralEarth] = useState<any[]>([
    { id: '1', loc: 'Primary (Located South Side of BC01 on column)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Primary (On VS01)', result: '', date: '', comments: '' },
    { id: '2', loc: 'Secondary (Located North Side of BC08 on column)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Secondary (On VS02)', result: '', date: '', comments: '' },
    { id: '3', loc: 'Tertiary (Located on South Side of VS03)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Tertiary (Located on Ground Floor SW corner of building)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Tertiary (On VS03)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Tertiary Tunnel (VF03)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Tertiary Tunnel (VF04)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Tertiary Tunnel (VF05)', result: '', date: '', comments: '' },
    { id: '-', loc: 'VF06', result: '', date: '', comments: '' },
    { id: '-', loc: 'Control (Ground Floor)', result: '', date: '', comments: '' },
    { id: '4', loc: 'Control (Located on North Side of VS04 on column)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Control (On VS04)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Control (On VS05)', result: '', date: '', comments: '' },
    { id: '5', loc: 'Final Screen (Located on East side of BC30 on column)', result: '', date: '', comments: '' },
    { id: '6', loc: 'MCC5 (Located in MCC5)', result: '', date: '', comments: '' },
    { id: '7', loc: 'MCC6 (Inside Switchboard)', result: '', date: '', comments: '' },
    { id: '-', loc: 'Pugmill (BC44 to BC45 Earth Strap)', result: '', date: '', comments: '' },
    { id: '-', loc: 'VS06', result: '', date: '', comments: '' },
    { id: '-', loc: 'VS07', result: '', date: '', comments: '' },
    { id: '-', loc: 'VF06', result: '', date: '', comments: '' },
  ]);

  // Sub Circuit Data
  const [subCircuits, setSubCircuits] = useState<any[]>([
    { circuit: '', type: '', id: '', result: '', date: '', comments: '' }
  ]);

  const addSubCircuitRow = () => {
    setSubCircuits([...subCircuits, { circuit: '', type: '', id: '', result: '', date: '', comments: '' }]);
  };

  const handleFinish = () => {
    let results = `SITE: ${site}\n\n`;
    
    results += "--- MAIN EARTH REGISTER (STAKE TO MASS) ---\n";
    mainEarthStake.forEach(r => {
      if (r.result) results += `${r.id} (${r.loc}): ${r.result} Ohms, Date: ${r.date}, Comm: ${r.comments}\n`;
    });

    results += "\n--- MAIN EARTH REGISTER (CONDUCTOR) ---\n";
    mainEarthConductor.forEach(r => {
      if (r.result) results += `${r.id} (${r.loc}): ${r.result} Ohms, Date: ${r.date}, Comm: ${r.comments}\n`;
    });

    results += "\n--- STRUCTURAL EARTH CONTINUITY ---\n";
    structuralEarth.forEach(r => {
      if (r.result) results += `Point ${r.id} (${r.loc}): ${r.result} Ohms, Date: ${r.date}, Comm: ${r.comments}\n`;
    });

    results += "\n--- SUB CIRCUIT CONTINUITY ---\n";
    results += "NOTE: Management has advised us not to do this testing as \"It is impractical due to the size of the site.\" Please advise us immediately if this has changed.\n";
    subCircuits.forEach(r => {
      if (r.result) results += `Circuit ${r.circuit} (${r.type}): ${r.result} Ohms, Date: ${r.date}, Comm: ${r.comments}\n`;
    });

    onComplete(results.trim());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col"
      >
        <header className="p-6 md:p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Earth Testing Register & Log</h2>
              <div className="flex items-center gap-2 mt-2">
                <MapPin size={14} className="text-indigo-200" />
                <input 
                  type="text" 
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="bg-indigo-500/30 border-none text-white placeholder:text-indigo-200 focus:ring-0 rounded px-2 py-1 text-sm font-bold w-64"
                  placeholder="Enter Site Location"
                />
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle size={32} />
            </button>
          </div>
          
          <div className="flex gap-2 md:gap-4 mt-8">
            {[
              { id: 'main', label: 'Main Earth' },
              { id: 'structural', label: 'Structural' },
              { id: 'subcircuit', label: 'Sub Circuit' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-indigo-600 shadow-lg" 
                    : "bg-indigo-500/30 text-white hover:bg-indigo-500/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'main' && (
            <div className="space-y-12">
              <section>
                <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                  Main earth stake to the general earth mass resistance test
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-4 border border-slate-100">Test Point</th>
                        <th className="p-4 border border-slate-100">Location on site</th>
                        <th className="p-4 border border-slate-100">Electrode/Grid</th>
                        <th className="p-4 border border-slate-100 w-32">Result (Ω)</th>
                        <th className="p-4 border border-slate-100 w-40">Date</th>
                        <th className="p-4 border border-slate-100">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700">
                      {mainEarthStake.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 border border-slate-100 bg-slate-50/50">{row.id}</td>
                          <td className="p-4 border border-slate-100">{row.loc}</td>
                          <td className="p-4 border border-slate-100">{row.electrode}</td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="text" 
                              value={row.result}
                              onChange={(e) => {
                                const newRows = [...mainEarthStake];
                                newRows[idx].result = e.target.value;
                                setMainEarthStake(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            />
                          </td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="date" 
                              value={row.date}
                              onChange={(e) => {
                                const newRows = [...mainEarthStake];
                                newRows[idx].date = e.target.value;
                                setMainEarthStake(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="text" 
                              value={row.comments}
                              onChange={(e) => {
                                const newRows = [...mainEarthStake];
                                newRows[idx].comments = e.target.value;
                                setMainEarthStake(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                  Resistance Testing of Main Earth Conductor
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-4 border border-slate-100">Test Point</th>
                        <th className="p-4 border border-slate-100">Location on site</th>
                        <th className="p-4 border border-slate-100">Location of MEN</th>
                        <th className="p-4 border border-slate-100 w-32">Result (Ω)</th>
                        <th className="p-4 border border-slate-100 w-40">Date</th>
                        <th className="p-4 border border-slate-100">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700">
                      {mainEarthConductor.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 border border-slate-100 bg-slate-50/50">{row.id}</td>
                          <td className="p-4 border border-slate-100">{row.loc}</td>
                          <td className="p-4 border border-slate-100">{row.men}</td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="text" 
                              value={row.result}
                              onChange={(e) => {
                                const newRows = [...mainEarthConductor];
                                newRows[idx].result = e.target.value;
                                setMainEarthConductor(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            />
                          </td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="date" 
                              value={row.date}
                              onChange={(e) => {
                                const newRows = [...mainEarthConductor];
                                newRows[idx].date = e.target.value;
                                setMainEarthConductor(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-4 border border-slate-100">
                            <input 
                              type="text" 
                              value={row.comments}
                              onChange={(e) => {
                                const newRows = [...mainEarthConductor];
                                newRows[idx].comments = e.target.value;
                                setMainEarthConductor(newRows);
                              }}
                              className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'structural' && (
            <section>
              <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                Structural Earth Continuity Register and Test Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4 border border-slate-100 w-24">Point No.</th>
                      <th className="p-4 border border-slate-100">Location / Description</th>
                      <th className="p-4 border border-slate-100 w-32">Result (Ω)</th>
                      <th className="p-4 border border-slate-100 w-40">Date</th>
                      <th className="p-4 border border-slate-100">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-700">
                    {structuralEarth.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 border border-slate-100 bg-slate-50/50">{row.id}</td>
                        <td className="p-4 border border-slate-100">{row.loc}</td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.result}
                            onChange={(e) => {
                              const newRows = [...structuralEarth];
                              newRows[idx].result = e.target.value;
                              setStructuralEarth(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="date" 
                            value={row.date}
                            onChange={(e) => {
                              const newRows = [...structuralEarth];
                              newRows[idx].date = e.target.value;
                              setStructuralEarth(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1 text-xs"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.comments}
                            onChange={(e) => {
                              const newRows = [...structuralEarth];
                              newRows[idx].comments = e.target.value;
                              setStructuralEarth(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'subcircuit' && (
            <section>
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl mb-8">
                <p className="text-amber-800 font-bold text-sm italic">
                  "Management has advised us not to do this testing as 'It is impractical due to the size of the site.' Please advise us immediately if this has changed."
                </p>
              </div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                  Sub Circuit Continuity Register and Test log
                </h3>
                <button 
                  onClick={addSubCircuitRow}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={16} />
                  Add Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-4 border border-slate-100">Circuit No.</th>
                      <th className="p-4 border border-slate-100">Type of Circuit</th>
                      <th className="p-4 border border-slate-100">ID / Outlet No.</th>
                      <th className="p-4 border border-slate-100 w-32">Result (Ω)</th>
                      <th className="p-4 border border-slate-100 w-40">Date</th>
                      <th className="p-4 border border-slate-100">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-700">
                    {subCircuits.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.circuit}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].circuit = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            placeholder="e.g. DB CB-1"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.type}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].type = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                            placeholder="e.g. Motor"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.id}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].id = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.result}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].result = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="date" 
                            value={row.date}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].date = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1 text-xs"
                          />
                        </td>
                        <td className="p-4 border border-slate-100">
                          <input 
                            type="text" 
                            value={row.comments}
                            onChange={(e) => {
                              const newRows = [...subCircuits];
                              newRows[idx].comments = e.target.value;
                              setSubCircuits(newRows);
                            }}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
          >
            Complete & Record Log
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function PFCWizard({ onClose, onComplete, project }: { onClose: () => void, onComplete: (results: string) => void, project: Project }) {
  const [units, setUnits] = useState<any[]>([
    { name: 'PFC-1 - Primary (MCC1)', fans: '', filters: '', cleanCubicle: '', checkConnections: '', selfTest: '', comments: '', completed: false },
    { name: 'PFC-2 Tertiary - (MCC2)', fans: '', filters: '', cleanCubicle: '', checkConnections: '', selfTest: '', comments: '', completed: false },
    { name: 'PFC-3 - Control (MCC3)', fans: '', filters: '', cleanCubicle: '', checkConnections: '', selfTest: '', comments: '', completed: false },
    { name: 'PFC-4 - Main Office (MSB4)', fans: '', filters: '', cleanCubicle: '', checkConnections: '', selfTest: '', comments: '', completed: false },
  ]);

  const handleFinish = () => {
    let results = "--- POWER FACTOR CORRECTION CAPACITORS TESTING ---\n\n";
    results += "Instructions: Disconnect power for 24 hours to allow capacitors to discharge. Clean or replace filters. Check operation of fans. Blow and/or vacuum dust from cabinet. Check all connections. Restore power and perform Self Test on controller and record pass or fail result.\n\n";
    results += "NOTE: Don't test individual capacitors, and measure phase current due to Holcim policies regarding live work. Instead use the testing function on the PFC Controller\n\n";
    
    units.forEach(u => {
      if (u.completed || u.fans || u.filters || u.cleanCubicle || u.checkConnections || u.selfTest) {
        results += `${u.name}:\n`;
        results += `  - Fans: ${u.fans || 'N/A'}\n`;
        results += `  - Filters: ${u.filters || 'N/A'}\n`;
        results += `  - Clean Cubicle: ${u.cleanCubicle || 'N/A'}\n`;
        results += `  - Check Connections: ${u.checkConnections || 'N/A'}\n`;
        results += `  - Self Test: ${u.selfTest || 'N/A'}\n`;
        if (u.comments) results += `  - Comments: ${u.comments}\n`;
        results += `  - Status: ${u.completed ? 'COMPLETED' : 'INCOMPLETE'}\n\n`;
      }
    });

    onComplete(results.trim());
  };

  const renderStatusButton = (unitIdx: number, field: 'fans' | 'filters' | 'cleanCubicle' | 'checkConnections' | 'selfTest', value: string) => {
    const currentVal = units[unitIdx][field];
    const isActive = currentVal === value;
    
    let colorClass = "bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200";
    if (isActive) {
      if (value === 'tick') colorClass = "bg-emerald-600 border-emerald-600 text-white shadow-md";
      else if (value === 'cross') colorClass = "bg-rose-600 border-rose-600 text-white shadow-md";
      else colorClass = "bg-slate-600 border-slate-600 text-white shadow-md";
    }

    return (
      <button
        onClick={() => {
          const newUnits = [...units];
          newUnits[unitIdx][field] = isActive ? '' : value;
          setUnits(newUnits);
        }}
        className={cn(
          "w-8 h-8 rounded-lg border flex items-center justify-center font-bold transition-all text-xs",
          colorClass
        )}
      >
        {value === 'tick' ? '✔' : value === 'cross' ? '✘' : '-'}
      </button>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col"
      >
        <header className="p-6 md:p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Test Power Factor Correction Capacitors</h2>
              <p className="text-indigo-200 text-sm font-bold mt-1">Item No: 12.5 | Location: Processing</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle size={32} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl mb-6">
            <h4 className="text-amber-800 font-black text-xs uppercase tracking-widest mb-2">Safety & Procedure</h4>
            <p className="text-amber-700 text-sm font-medium leading-relaxed">
              Disconnect power for 24 hours to allow capacitors to discharge. Clean or replace filters. Check operation of fans. Blow and/or vacuum dust from cabinet. Check all connections. Restore power and perform Self Test on controller and record pass or fail result.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
            <h4 className="text-indigo-800 font-black text-xs uppercase tracking-widest mb-2">Important Note</h4>
            <p className="text-indigo-700 text-sm font-bold italic leading-relaxed">
              "Don't test individual capacitors, and measure phase current due to Holcim policies regarding live work. Instead use the testing function on the PFC Controller"
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 border border-slate-100">Description</th>
                  <th className="p-4 border border-slate-100 text-center w-24">Fans</th>
                  <th className="p-4 border border-slate-100 text-center w-24">Filters</th>
                  <th className="p-4 border border-slate-100 text-center w-24">Clean Cubicle</th>
                  <th className="p-4 border border-slate-100 text-center w-24">Check Conn.</th>
                  <th className="p-4 border border-slate-100 text-center w-24">Self Test</th>
                  <th className="p-4 border border-slate-100">Comments</th>
                  <th className="p-4 border border-slate-100 w-24 text-center">Completed</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-700">
                {units.map((unit, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border border-slate-100 bg-slate-50/50">{unit.name}</td>
                    <td className="p-4 border border-slate-100">
                      <div className="flex justify-center gap-1">
                        {renderStatusButton(idx, 'fans', 'tick')}
                        {renderStatusButton(idx, 'fans', 'cross')}
                        {renderStatusButton(idx, 'fans', 'na')}
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <div className="flex justify-center gap-1">
                        {renderStatusButton(idx, 'filters', 'tick')}
                        {renderStatusButton(idx, 'filters', 'cross')}
                        {renderStatusButton(idx, 'filters', 'na')}
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <div className="flex justify-center gap-1">
                        {renderStatusButton(idx, 'cleanCubicle', 'tick')}
                        {renderStatusButton(idx, 'cleanCubicle', 'cross')}
                        {renderStatusButton(idx, 'cleanCubicle', 'na')}
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <div className="flex justify-center gap-1">
                        {renderStatusButton(idx, 'checkConnections', 'tick')}
                        {renderStatusButton(idx, 'checkConnections', 'cross')}
                        {renderStatusButton(idx, 'checkConnections', 'na')}
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <div className="flex justify-center gap-1">
                        {renderStatusButton(idx, 'selfTest', 'tick')}
                        {renderStatusButton(idx, 'selfTest', 'cross')}
                        {renderStatusButton(idx, 'selfTest', 'na')}
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={unit.comments}
                        onChange={(e) => {
                          const newUnits = [...units];
                          newUnits[idx].comments = e.target.value;
                          setUnits(newUnits);
                        }}
                        className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                        placeholder="Add notes..."
                      />
                    </td>
                    <td className="p-4 border border-slate-100 text-center">
                      <input 
                        type="checkbox" 
                        checked={unit.completed}
                        onChange={(e) => {
                          const newUnits = [...units];
                          newUnits[idx].completed = e.target.checked;
                          setUnits(newUnits);
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600 flex items-center justify-center text-white text-[8px]">✔</div>
              <span>OK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-600 flex items-center justify-center text-white text-[8px]">✘</div>
              <span>Faulty / Attention Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-600 flex items-center justify-center text-white text-[8px]">-</div>
              <span>N/A</span>
            </div>
          </div>
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
          >
            Complete & Record Log
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function MotorTestWizard({ onClose, onComplete, project }: { onClose: () => void, onComplete: (results: string) => void, project: Project }) {
  const [activeTab, setActiveTab] = useState<'conveyors' | 'pugmills' | 'screens' | 'crushers'>('conveyors');
  
  const [conveyors, setConveyors] = useState<any[]>([
    { name: '311-BC06', kw: '110', amp: '198', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '321-BC11', kw: '75', amp: '120', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '331-BC12', kw: '55', amp: '96', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '331-BC14', kw: '45', amp: '76', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '341-BC16', kw: '22', amp: '38', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '341-BC24', kw: '55', amp: '91', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '361-BC34', kw: '30', amp: '53', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '362-BC43', kw: '65', amp: '92', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '362-BC45', kw: '37', amp: '64.8', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
  ]);

  const [pugmills, setPugmills] = useState<any[]>([
    { name: '361-MZ01 Pugmill 1', kw: '30', amp: '53', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '361-MZ02 Pugmill 2', kw: '90', amp: '147', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
  ]);

  const [screens, setScreens] = useState<any[]>([
    { name: '311-VS01 E', kw: '22', amp: '39', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '311-VS01 W', kw: '22', amp: '39', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '321-VS02', kw: '30', amp: '53.7', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '331-VS03', kw: '30', amp: '53', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '341-VS04', kw: '30', amp: '53', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '341-VS05', kw: '11.5', amp: '28', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '342-VS06', kw: '30', amp: '53.3', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '342-VS07', kw: '30', amp: '53.3', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
  ]);

  const [crushers, setCrushers] = useState<any[]>([
    { name: '311-JC01', kw: '185', amp: '343', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '321-CZ02', kw: '400', amp: '690', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '331-CZ03', kw: '185', amp: '294', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '331-CZ04', kw: '185', amp: '297', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
    { name: '341-CZ05', kw: '185', amp: '297', run: '', upe: '', vpe: '', wpe: '', uv: '', uw: '', vw: '', comments: '', completed: false },
  ]);

  const handleFinish = () => {
    let results = "--- ELECTRIC MOTOR TESTING RESULTS ---\n\n";
    
    const formatSection = (title: string, data: any[]) => {
      let sectionStr = `[${title}]\n`;
      data.forEach(r => {
        if (r.completed || r.run || r.upe || r.uv) {
          sectionStr += `${r.name}: Run Amps=${r.run}, IR(U-PE/V-PE/W-PE)=${r.upe}/${r.vpe}/${r.wpe}, Ohm(U-V/U-W/V-W)=${r.uv}/${r.uw}/${r.vw}, Comm: ${r.comments}\n`;
        }
      });
      return sectionStr + "\n";
    };

    results += formatSection("CONVEYORS", conveyors);
    results += formatSection("PUGMILLS", pugmills);
    results += formatSection("SCREENS", screens);
    results += formatSection("CRUSHERS", crushers);

    onComplete(results.trim());
  };

  const renderTable = (data: any[], setter: (val: any[]) => void) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <th className="p-4 border border-slate-100">Equipment</th>
            <th className="p-4 border border-slate-100 w-20">kW</th>
            <th className="p-4 border border-slate-100 w-20">Amp</th>
            <th className="p-4 border border-slate-100 w-24">Run Amps</th>
            <th className="p-4 border border-slate-100 text-center" colSpan={3}>IR Test (MΩ)</th>
            <th className="p-4 border border-slate-100 text-center" colSpan={3}>Ohm (Ω)</th>
            <th className="p-4 border border-slate-100">Comments</th>
            <th className="p-4 border border-slate-100 w-20 text-center">Done</th>
          </tr>
          <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-400">
            <th className="border border-slate-100" colSpan={4}></th>
            <th className="p-2 border border-slate-100 text-center">U-PE</th>
            <th className="p-2 border border-slate-100 text-center">V-PE</th>
            <th className="p-2 border border-slate-100 text-center">W-PE</th>
            <th className="p-2 border border-slate-100 text-center">U-V</th>
            <th className="p-2 border border-slate-100 text-center">U-W</th>
            <th className="p-2 border border-slate-100 text-center">V-W</th>
            <th className="border border-slate-100" colSpan={2}></th>
          </tr>
        </thead>
        <tbody className="text-sm font-bold text-slate-700">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 border border-slate-100 bg-slate-50/50">{row.name}</td>
              <td className="p-4 border border-slate-100 text-slate-400">{row.kw}</td>
              <td className="p-4 border border-slate-100 text-slate-400">{row.amp}</td>
              <td className="p-4 border border-slate-100">
                <input 
                  type="text" 
                  value={row.run}
                  onChange={(e) => {
                    const newRows = [...data];
                    newRows[idx].run = e.target.value;
                    setter(newRows);
                  }}
                  className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.upe} onChange={(e) => { const n = [...data]; n[idx].upe = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.vpe} onChange={(e) => { const n = [...data]; n[idx].vpe = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.wpe} onChange={(e) => { const n = [...data]; n[idx].wpe = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.uv} onChange={(e) => { const n = [...data]; n[idx].uv = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.uw} onChange={(e) => { const n = [...data]; n[idx].uw = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input type="text" value={row.vw} onChange={(e) => { const n = [...data]; n[idx].vw = e.target.value; setter(n); }} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center" />
              </td>
              <td className="p-4 border border-slate-100">
                <input 
                  type="text" 
                  value={row.comments}
                  onChange={(e) => {
                    const newRows = [...data];
                    newRows[idx].comments = e.target.value;
                    setter(newRows);
                  }}
                  className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                />
              </td>
              <td className="p-4 border border-slate-100 text-center">
                <input 
                  type="checkbox" 
                  checked={row.completed}
                  onChange={(e) => {
                    const newRows = [...data];
                    newRows[idx].completed = e.target.checked;
                    setter(newRows);
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col"
      >
        <header className="p-6 md:p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Electric Motor Testing Register</h2>
              <p className="text-indigo-200 text-sm font-bold mt-1">Inspection Item 12.5 / 12.6</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle size={32} />
            </button>
          </div>
          
          <div className="flex gap-2 md:gap-4 mt-8">
            {[
              { id: 'conveyors', label: 'Conveyors' },
              { id: 'pugmills', label: 'Pugmills' },
              { id: 'screens', label: 'Screens' },
              { id: 'crushers', label: 'Crushers' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-indigo-600 shadow-lg" 
                    : "bg-indigo-500/30 text-white hover:bg-indigo-500/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'conveyors' && renderTable(conveyors, setConveyors)}
          {activeTab === 'pugmills' && renderTable(pugmills, setPugmills)}
          {activeTab === 'screens' && renderTable(screens, setScreens)}
          {activeTab === 'crushers' && renderTable(crushers, setCrushers)}
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
          >
            Complete & Record Log
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function OverloadWizard({ onClose, onComplete, project }: { onClose: () => void, onComplete: (results: string) => void, project: Project }) {
  const [activeTab, setActiveTab] = useState('311-1M01 (Primary)');
  const [data, setData] = useState<Record<string, any[]>>({
    '311-1M01 (Primary)': [
      { motor: 'BC01 CONVEYOR', cb: '20A', ol: '8.3A', flc: '7.9A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC02 CONVEYOR', cb: '20A', ol: '14.7A', flc: '14.3A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC03 CONVEYOR', cb: '50A', ol: '38A', flc: '38.5A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC04 CONVEYOR', cb: '63A', ol: '39A', flc: '26.6A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC05 CONVEYOR', cb: '100A', ol: '39A', flc: '38.5A', cable: '10mm²', comments: '', completed: false },
      { motor: 'BC06 CONVEYOR', cb: '198A', ol: '198A', flc: '198A', cable: '70mm²', comments: '', completed: false },
      { motor: 'BC07 CONVEYOR', cb: '40A', ol: '14A', flc: '14A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC08 CONVEYOR', cb: '25A', ol: '16A', flc: '13.8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC09 CONVEYOR', cb: '20A', ol: '14.7A', flc: '14.1A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC10 CONVEYOR', cb: '80A', ol: '-', flc: '-', cable: '16mm²', comments: 'VFD', completed: false },
      { motor: 'BC11 CONVEYOR', cb: '125A', ol: '120A', flc: '120A', cable: '50mm²', comments: '', completed: false },
      { motor: 'BC11 CF1', cb: '6.3A', ol: '6.3A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'VS01 SCREEN MOTOR 1', cb: '100A', ol: '39A', flc: '39A', cable: '10mm²', comments: '', completed: false },
      { motor: 'VS01 SCREEN MOTOR 2', cb: '100A', ol: '39A', flc: '39A', cable: '10mm²', comments: '', completed: false },
      { motor: 'VS02 SCREEN', cb: '100A', ol: '54A', flc: '53.7A', cable: '16mm²', comments: 'VFD', completed: false },
      { motor: 'RQ01 ROCK BREAKER', cb: '75A', ol: '53A', flc: '51.5A', cable: '16mm²', comments: '', completed: false },
      { motor: 'AF01 APRON FEEDER', cb: '100A', ol: '68A', flc: '68A', cable: '16mm²', comments: '', completed: false },
      { motor: 'AF01 OIL COOLER', cb: '10A', ol: '5.4A', flc: '4.5A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'PU01 WATER PUMP', cb: '10A', ol: '10A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
    ],
    '311-1M01 (P & S)': [
      { motor: 'JC01 CRUSHER', cb: '', ol: '', flc: '', cable: '', comments: '', completed: false },
      { motor: 'JC01 GPC1 GREASE PUMP', cb: '1.6A', ol: '1.6A', flc: '1.2A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'JC01 GPC2 GREASE PUMP', cb: '1.6A', ol: '1.6A', flc: 'N/A', cable: '2.5mm²', comments: 'N/A Not Connected', completed: false },
      { motor: 'CZ02 CRUSHER', cb: '', ol: '', flc: '', cable: '', comments: '', completed: false },
      { motor: 'CZ02 LOP LUBE OIL PUMP', cb: '8A', ol: '8A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ02 CFC COOLING FAN', cb: '16A', ol: '15A', flc: '15A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ02 WP WATER PUMP', cb: '1.9A', ol: '1.9A', flc: '1.8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'PU02 WATER PUMP', cb: '15A', ol: '16A', flc: '16A', cable: '4mm²', comments: '', completed: false },
      { motor: 'SECONDARY ROLLER DOOR', cb: '6.3A', ol: '6.3A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC11 HOOD', cb: '22A', ol: '17A', flc: '-', cable: '4mm²', comments: '', completed: false },
      { motor: 'CZ02 WATER PUMP', cb: '18A', ol: '2.5A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
    ],
    '311-1M01 (Tertiary)': [
      { motor: 'BC12 Conveyor', cb: '125A', ol: '110A', flc: '96A', cable: '50mm²', comments: '', completed: false },
      { motor: 'BC12 Conveyor Cooling Fan', cb: '6.3A', ol: '6.3A', flc: '-', cable: '1mm²', comments: '', completed: false },
      { motor: 'BC13 Conveyor', cb: '40A', ol: '31A', flc: '27.7A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC14 Conveyor', cb: '100A', ol: '83A', flc: '76A', cable: '25mm²', comments: '', completed: false },
      { motor: 'BC16 Conveyor', cb: '40A', ol: '39A', flc: '38A', cable: '6mm²', comments: '', completed: false },
      { motor: 'AF02 Apron Feeder', cb: '32A', ol: '28A', flc: '25.8A', cable: '4mm²', comments: '', completed: false },
      { motor: 'VF05 Feeder', cb: '10A', ol: '3.6A', flc: '3.1A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'VF06 Feeder', cb: '25A', ol: '20.4A', flc: '19.3A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'VF07 Feeder', cb: '25A', ol: '13A', flc: '19.3A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'VS03 Screen', cb: '75A', ol: '55A', flc: '53A', cable: '16mm²', comments: '', completed: false },
      { motor: 'CZ03 Crusher', cb: '400A', ol: '100%', flc: '297A', cable: '185mm²', comments: '', completed: false },
      { motor: 'CZ03 Hydroset Pump', cb: '4A', ol: '4A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ03 Lube Oil Pump', cb: '8A', ol: '8A', flc: '7.7A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ03 Oil Tank', cb: '8A', ol: '8A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ03 Pinion Pump', cb: '1.2A', ol: '1.2A', flc: '1A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ03 PFC', cb: '1.2A', ol: '1.2A', flc: '1.13A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ03 Gear Lube Unit', cb: '1.75A', ol: '1.75A', flc: '1.61A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'MAG', cb: '16A', ol: '16A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 Crusher', cb: '400A', ol: '101%', flc: '297A', cable: '185mm²', comments: '', completed: false },
      { motor: 'CZ04 Hydroset Pump', cb: '4.5A', ol: '4.5A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 Lube Oil Pump', cb: '8A', ol: '8A', flc: '7.7A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 Oil Tank', cb: '8A', ol: '8A', flc: '7.6A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 Pinion Pump', cb: '1.2A', ol: '1.2A', flc: '1A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 PFC', cb: '1.2A', ol: '1.2A', flc: '1.13A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ04 Gear Lube Unit', cb: '1.6A', ol: '1.6A', flc: '1.61A', cable: '2.5mm²', comments: '', completed: false },
    ],
    '341-1M03 (Control)': [
      { motor: 'BC15 Conveyor', cb: '20A', ol: '9A', flc: '8.9A', cable: '2.5mm²', comments: 'Should be 16A D curve', completed: false },
      { motor: 'BC17 Conveyor', cb: '40A', ol: '27A', flc: '26.5A', cable: '6mm²', comments: 'Should be 32A D curve', completed: false },
      { motor: 'BC18 Conveyor', cb: '20A', ol: '14A', flc: '14.3A', cable: '2.5mm²', comments: 'Should be 16A D curve', completed: false },
      { motor: 'BC19 Conveyor', cb: '40A', ol: '32A', flc: '33A', cable: '6mm²', comments: 'Should be 32A D curve', completed: false },
      { motor: 'BC20 Conveyor', cb: '20A', ol: '8A', flc: '8A', cable: '2.5mm²', comments: 'Should be 16A D curve', completed: false },
      { motor: 'BC22 Conveyor', cb: '25A', ol: '14A', flc: '14.3A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC29 Conveyor', cb: '25A', ol: '15A', flc: '13.4A', cable: '2.5mm²', comments: 'Should be 16A D curve', completed: false },
      { motor: 'VS04 Screen', cb: '80A', ol: '53A', flc: '53A', cable: '16mm²', comments: '', completed: false },
      { motor: 'VS05 Screen', cb: '40A', ol: '27A', flc: '27.5A', cable: '10mm²', comments: '', completed: false },
      { motor: 'CZ05 Crusher', cb: '400A', ol: '85%', flc: '294', cable: '120mm²', comments: '', completed: false },
      { motor: 'CZ05 LOP', cb: '8A', ol: '8A', flc: '7.7A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ05 LPC', cb: '1.75A', ol: '1.75A', flc: '1.61A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ05 CFC', cb: '8A', ol: '8A', flc: '7.64A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ05 PP', cb: '1.6A', ol: '1.6A', flc: '1A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ05 PFC', cb: '4A', ol: '4A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ05 HTR', cb: '15A', ol: '15A', flc: '4.4A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CZ06 Crusher', cb: '360A', ol: '290A', flc: '-', cable: '120mm²', comments: '', completed: false },
      { motor: 'BC23 Conveyor', cb: '20A', ol: '12A', flc: '-', cable: '40mm²', comments: '', completed: false },
      { motor: 'LOP', cb: '16A', ol: '8A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'HYD', cb: '10A', ol: '5A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'GREASE PUMP', cb: '10A', ol: '1.1A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'CFE', cb: '10A', ol: '1.2A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'HTR', cb: '10A', ol: 'N/A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'AIR BLOWER', cb: '10A', ol: '1.1A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
    ],
    '342-1M04 (Final)': [
      { motor: 'BC21 Conveyor', cb: '50A', ol: '28A', flc: '27A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC24 Conveyor', cb: '160A', ol: '95A', flc: '91A', cable: '25mm²', comments: '', completed: false },
      { motor: 'BC25 Conveyor', cb: '63A', ol: '26A', flc: '26A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC26 Conveyor', cb: '20A', ol: '8A', flc: '7.98A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC27 Conveyor', cb: '40A', ol: '22A', flc: '20.5A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC28 Conveyor', cb: '20A', ol: '7A', flc: '7.75A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC30 Conveyor', cb: '63A', ol: '26A', flc: '26.5A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC31 Conveyor', cb: '40A', ol: '15.75A', flc: '14.3A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC32 Conveyor', cb: '40A', ol: '14A', flc: '14.3A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC33 Conveyor', cb: '40A', ol: '12A', flc: '10.6A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC34 Conveyor', cb: '75A', ol: '56A', flc: '52', cable: '25mm²', comments: '', completed: false },
      { motor: 'BC35 Conveyor', cb: '25A', ol: '10.5a', flc: '11A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC36 Conveyor', cb: '63A', ol: '14A', flc: '26.5A', cable: '10mm²', comments: '', completed: false },
      { motor: 'BC37 Conveyor', cb: '25A', ol: '10.5A', flc: '10.6A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC38 Conveyor', cb: '63A', ol: '26A', flc: '26.5A', cable: '10mm²', comments: '', completed: false },
      { motor: 'BC39 Conveyor', cb: '25A', ol: '10.5A', flc: '10.2A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC40 Conveyor', cb: '63A', ol: '26A', flc: '26.5A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC41 Conveyor', cb: '25A', ol: '8A', flc: '10.2A', cable: '4mm²', comments: '', completed: false },
      { motor: 'BC42 Conveyor', cb: '63A', ol: '26A', flc: '27.3A', cable: '16mm²', comments: '', completed: false },
      { motor: 'MZ01 Pugmill', cb: '100A', ol: '55A', flc: '53A', cable: '35mm²', comments: '', completed: false },
      { motor: 'VS06 Screen', cb: '75A', ol: '55A', flc: '53.3A', cable: '16mm²', comments: '', completed: false },
      { motor: 'VS07 Screen', cb: '75A', ol: '55A', flc: '53.3A', cable: '16mm²', comments: '', completed: false },
      { motor: 'Hydro Door', cb: '100A', ol: '52A', flc: '53A', cable: '16mm²', comments: 'Not in service', completed: false },
      { motor: 'CF', cb: '16A', ol: '16A', flc: '-', cable: '2.5mm²', comments: 'Not in service', completed: false },
    ],
    '362-1W05 (Tunnel)': [
      { motor: 'WF08', cb: '50A', ol: '20A', flc: '20A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF09', cb: '50A', ol: '20A', flc: '20A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF10', cb: '40A', ol: '14.5A', flc: '20A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WF11', cb: '40A', ol: '15A', flc: '20A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WF12', cb: '50A', ol: '20A', flc: '20A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF13', cb: '50A', ol: '20A', flc: '20A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF14', cb: '50A', ol: '16A', flc: '15.5A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF15', cb: '50A', ol: '15A', flc: '14.1A', cable: '4mm²', comments: '', completed: false },
      { motor: 'WF17', cb: '25A', ol: '14A', flc: '15.4A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WQ01 Spaceship/1', cb: '32A', ol: '9.5A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WQ01 Spaceship/2', cb: '" "', ol: '9.5A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WQ02 Spaceship/1', cb: '32A', ol: '9.5A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WQ02 Spaceship/2', cb: '" "', ol: '9.5A', flc: '8A', cable: '2.5mm²', comments: '', completed: false },
    ],
    '362-1W06 (Pugmill)': [
      { motor: 'MZ02 Pugmill', cb: '200A', ol: '147A', flc: '147A', cable: '70mm²', comments: '', completed: false },
      { motor: 'PU05 Water Pump', cb: '32A', ol: '8A', flc: '8A', cable: '4mm²', comments: '', completed: false },
      { motor: 'PU06 Water Pump', cb: '50A', ol: '39A', flc: '39A', cable: '10mm²', comments: '', completed: false },
      { motor: 'PU23 Water Pump', cb: '20A', ol: '9.5A', flc: '9.3A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'BC43 Conveyor', cb: '100A', ol: '92A', flc: '92A', cable: '25mm²', comments: '', completed: false },
      { motor: 'BC44 Conveyor', cb: '40A', ol: '29A', flc: '26.5A', cable: '6mm²', comments: '', completed: false },
      { motor: 'BC45 Conveyor', cb: '125A', ol: '65A', flc: '64.8A', cable: '50mm²', comments: '', completed: false },
      { motor: 'BC45 Radial Travel Motor', cb: '40A', ol: '4.9A', flc: '4.7A', cable: '2.5mm²', comments: '', completed: false },
    ],
    'Ancillary': [
      { motor: 'Main Pump 22kw Motor', cb: '50A', ol: '40A', flc: '37.2A', cable: '10mm²', comments: '', completed: false },
      { motor: 'Main Pump 11kw Motor', cb: '20A', ol: '8A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'Wheel Wash C1 Pump (PU09)', cb: '100A', ol: '55A', flc: '50.9A', cable: '16mm²', comments: '', completed: false },
      { motor: 'WW C2 Oscilator Drive 1', cb: '4A', ol: '1A', flc: '0.9A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WW C3 Oscilator Drive 2', cb: '4A', ol: '1A', flc: '0.9A', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'WW C4 Compressor', cb: '16A', ol: '10A', flc: '-', cable: '2.5mm²', comments: '', completed: false },
      { motor: 'Final Tunnel Pump PU04', cb: '40A', ol: '29A', flc: '26.6A', cable: '6mm²', comments: '', completed: false },
      { motor: 'Final Tunnel Backup Pump', cb: '40A', ol: '28A', flc: '28A', cable: '6mm²', comments: '', completed: false },
    ]
  });

  const handleFinish = () => {
    let results = "--- MOTOR OVERLOAD SETTINGS INSPECTION ---\n\n";
    
    Object.entries(data).forEach(([location, rows]) => {
      results += `[LOCATION: ${location}]\n`;
      rows.forEach(r => {
        if (r.completed || r.motor) {
          results += `${r.motor}: CB=${r.cb}, OL=${r.ol}, FLC=${r.flc}, Cable=${r.cable}, Comm: ${r.comments}, Status: ${r.completed ? 'COMPLETED' : 'PENDING'}\n`;
        }
      });
      results += "\n";
    });

    onComplete(results.trim());
  };

  const addRow = () => {
    const newData = { ...data };
    newData[activeTab] = [...newData[activeTab], { motor: '', cb: '', ol: '', flc: '', cable: '', comments: '', completed: false }];
    setData(newData);
  };

  const deleteRow = (idx: number) => {
    const newData = { ...data };
    newData[activeTab] = newData[activeTab].filter((_, i) => i !== idx);
    setData(newData);
  };

  const updateRow = (idx: number, field: string, value: any) => {
    const newData = { ...data };
    newData[activeTab][idx][field] = value;
    setData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col"
      >
        <header className="p-6 md:p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Check All Motor Overload Settings</h2>
              <p className="text-indigo-200 text-sm font-bold mt-1">Inspection Item 12.6 / 12.7</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle size={32} />
            </button>
          </div>
          
          <div className="flex gap-2 md:gap-4 mt-8 overflow-x-auto pb-2 no-scrollbar">
            {Object.keys(data).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-white text-indigo-600 shadow-lg" 
                    : "bg-indigo-500/30 text-white hover:bg-indigo-500/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              {activeTab} - Overload Settings
            </h3>
            <button 
              onClick={addRow}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <Plus size={16} />
              Add Motor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 border border-slate-100">Motor / Equipment</th>
                  <th className="p-4 border border-slate-100 w-24">C/B Size</th>
                  <th className="p-4 border border-slate-100 w-24">O/L Size</th>
                  <th className="p-4 border border-slate-100 w-24">F.L.C.</th>
                  <th className="p-4 border border-slate-100 w-24">Cable Size</th>
                  <th className="p-4 border border-slate-100">Comments</th>
                  <th className="p-4 border border-slate-100 w-20 text-center">Done</th>
                  <th className="p-4 border border-slate-100 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-700">
                {data[activeTab].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <Pencil size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <input 
                          type="text" 
                          value={row.motor}
                          onChange={(e) => updateRow(idx, 'motor', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1"
                          placeholder="Motor name..."
                        />
                      </div>
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={row.cb}
                        onChange={(e) => updateRow(idx, 'cb', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center"
                      />
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={row.ol}
                        onChange={(e) => updateRow(idx, 'ol', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center"
                      />
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={row.flc}
                        onChange={(e) => updateRow(idx, 'flc', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center"
                      />
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={row.cable}
                        onChange={(e) => updateRow(idx, 'cable', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-center"
                      />
                    </td>
                    <td className="p-4 border border-slate-100">
                      <input 
                        type="text" 
                        value={row.comments}
                        onChange={(e) => updateRow(idx, 'comments', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1"
                        placeholder="Notes..."
                      />
                    </td>
                    <td className="p-4 border border-slate-100 text-center">
                      <input 
                        type="checkbox" 
                        checked={row.completed}
                        onChange={(e) => updateRow(idx, 'completed', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-4 border border-slate-100 text-center">
                      <button 
                        onClick={() => deleteRow(idx)}
                        className="text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data[activeTab].length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-4">
              <p className="text-slate-400 font-bold">No motors listed for this location.</p>
              <button onClick={addRow} className="text-indigo-600 font-black uppercase text-xs mt-2 hover:underline">Add First Motor</button>
            </div>
          )}
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
          >
            Complete & Record Log
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function SLDWizard({ onClose, onComplete, project }: { onClose: () => void, onComplete: (results: string) => void, project: Project }) {
  const [activeTab, setActiveTab] = useState('Primary');
  const [data, setData] = useState<Record<string, any[]>>({
    'Primary': [
      { desc: 'DBX1 (Light & Power)', present: false, comments: '', complete: false },
      { desc: '1M01 (Motors)', present: false, comments: '', complete: false },
      { desc: 'JC01 (Crusher 1)', present: false, comments: '', complete: false },
    ],
    'Secondary': [
      { desc: 'DBX1A (Light & Power)', present: false, comments: '', complete: false },
      { desc: 'CZ02 (Crusher 2)', present: false, comments: '', complete: false },
    ],
    'Tertiary': [
      { desc: 'DBX2 (Light & Power)', present: false, comments: '', complete: false },
      { desc: '1M02 (Motors)', present: false, comments: '', complete: false },
      { desc: 'CZ03 (Crusher 3)', present: false, comments: '', complete: false },
      { desc: 'CZ04 (Crusher 4)', present: false, comments: '', complete: false },
    ],
    'Control': [
      { desc: 'DBX3 (Light & Power)', present: false, comments: '', complete: false },
      { desc: '1M03 (Motors)', present: false, comments: '', complete: false },
      { desc: 'CZ05 (Crusher 5)', present: false, comments: '', complete: false },
      { desc: 'CZ06 (Crusher 6)', present: false, comments: '', complete: false },
    ],
    'Final Building': [
      { desc: 'DBX4 (Light & Power)', present: false, comments: '', complete: false },
      { desc: '1M04 (Motors)', present: false, comments: '', complete: false },
    ],
    'Final Tunnel': [
      { desc: 'DBX5 (Pumps, Light & Power)', present: false, comments: '', complete: false },
      { desc: '1M05 (Motors)', present: false, comments: '', complete: false },
    ],
    'Pugmill': [
      { desc: 'DBX6 (Pumps, Light & Power, Compressors)', present: false, comments: '', complete: false },
      { desc: '1M06 (Motors)', present: false, comments: '', complete: false },
    ]
  });

  const handleFinish = () => {
    let results = "--- SINGLE LINE DIAGRAM REVIEW RESULTS ---\n\n";
    Object.entries(data).forEach(([location, rows]) => {
      results += `[${location}]\n`;
      rows.forEach(r => {
        results += `${r.desc}: SLD Present=${r.present ? 'Yes' : 'No'}, Comments=${r.comments || 'None'}, Complete=${r.complete ? 'Yes' : 'No'}\n`;
      });
      results += "\n";
    });
    onComplete(results.trim());
  };

  const updateRow = (location: string, idx: number, field: string, value: any) => {
    const newData = { ...data };
    newData[location][idx] = { ...newData[location][idx], [field]: value };
    setData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-indigo-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col"
      >
        <header className="p-6 md:p-8 border-b border-slate-100 bg-indigo-600 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Review Single Line Diagrams</h2>
              <p className="text-indigo-200 text-sm font-bold mt-1">Inspection Item 12.9</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <XCircle size={32} />
            </button>
          </div>
          
          <div className="flex gap-2 md:gap-4 mt-8 overflow-x-auto pb-2 no-scrollbar">
            {Object.keys(data).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-white text-indigo-600 shadow-lg" 
                    : "bg-indigo-500/30 text-white hover:bg-indigo-500/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-4 border border-slate-100">Description</th>
                <th className="p-4 border border-slate-100 w-48 text-center">SLD Present & Up-to-date</th>
                <th className="p-4 border border-slate-100">Comments / Actions</th>
                <th className="p-4 border border-slate-100 w-32 text-center">Complete</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-700">
              {data[activeTab].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 border border-slate-100 bg-slate-50/50">{row.desc}</td>
                  <td className="p-4 border border-slate-100 text-center">
                    <input 
                      type="checkbox" 
                      checked={row.present}
                      onChange={(e) => updateRow(activeTab, idx, 'present', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-4 border border-slate-100">
                    <input 
                      type="text" 
                      value={row.comments}
                      onChange={(e) => updateRow(activeTab, idx, 'comments', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
                      placeholder="Add comments..."
                    />
                  </td>
                  <td className="p-4 border border-slate-100 text-center">
                    <input 
                      type="checkbox" 
                      checked={row.complete}
                      onChange={(e) => updateRow(activeTab, idx, 'complete', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm"
          >
            Complete & Record Log
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
