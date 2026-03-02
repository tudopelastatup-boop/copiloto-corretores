import React, { useState } from 'react';
import { ContractTemplate, Lead, UserProfile } from '../types';

interface ContratosProps {
  contracts: ContractTemplate[];
  setContracts: React.Dispatch<React.SetStateAction<ContractTemplate[]>>;
  leads: Lead[];
  user: UserProfile;
}

const PLACEHOLDERS = [
  { key: '{{NOME_COMPRADOR}}', label: 'Nome do Comprador' },
  { key: '{{CPF_COMPRADOR}}', label: 'CPF do Comprador' },
  { key: '{{ENDERECO_IMOVEL}}', label: 'Endereço do Imóvel' },
  { key: '{{VALOR_IMOVEL}}', label: 'Valor do Imóvel' },
  { key: '{{DATA}}', label: 'Data' },
  { key: '{{NOME_CORRETOR}}', label: 'Nome do Corretor' },
  { key: '{{CRECI}}', label: 'CRECI' },
];

const downloadText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Contratos: React.FC<ContratosProps> = ({ contracts, setContracts, leads, user }) => {
  // Views: 'list' | 'view' | 'edit' | 'generate'
  const [view, setView] = useState<'list' | 'view' | 'edit' | 'generate'>('list');
  const [selectedContract, setSelectedContract] = useState<ContractTemplate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state for add/edit
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  // Generate state
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredContracts = contracts.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========== CRUD ==========

  const handleAdd = () => {
    setFormTitle('');
    setFormContent('');
    setShowAddModal(true);
  };

  const handleSaveNew = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const newContract: ContractTemplate = {
      id: `ct-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setContracts(prev => [newContract, ...prev]);
    setShowAddModal(false);
  };

  const handleEdit = (contract: ContractTemplate) => {
    setSelectedContract(contract);
    setFormTitle(contract.title);
    setFormContent(contract.content);
    setView('edit');
  };

  const handleSaveEdit = () => {
    if (!selectedContract || !formTitle.trim() || !formContent.trim()) return;
    setContracts(prev =>
      prev.map(c =>
        c.id === selectedContract.id
          ? { ...c, title: formTitle.trim(), content: formContent.trim(), updatedAt: Date.now() }
          : c
      )
    );
    setSelectedContract({ ...selectedContract, title: formTitle.trim(), content: formContent.trim(), updatedAt: Date.now() });
    setView('view');
  };

  const handleDelete = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    setShowDeleteConfirm(null);
    if (selectedContract?.id === id) {
      setSelectedContract(null);
      setView('list');
    }
  };

  const handleView = (contract: ContractTemplate) => {
    setSelectedContract(contract);
    setView('view');
  };

  // ========== GENERATE ==========

  const handleStartGenerate = (contract: ContractTemplate) => {
    setSelectedContract(contract);
    setSelectedLeadId('');
    setExtraFields({
      '{{CPF_COMPRADOR}}': '',
      '{{ENDERECO_IMOVEL}}': '',
      '{{VALOR_IMOVEL}}': '',
    });
    setGeneratedContent('');
    setShowGeneratedPreview(false);
    setView('generate');
  };

  const handleGenerate = () => {
    if (!selectedContract || !selectedLeadId) return;
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    const today = new Date().toLocaleDateString('pt-BR');
    let content = selectedContract.content;

    // Auto-fill from lead
    content = content.replace(/\{\{NOME_COMPRADOR\}\}/g, lead.name);
    content = content.replace(/\{\{NOME_CORRETOR\}\}/g, user.name);
    content = content.replace(/\{\{CRECI\}\}/g, user.creci);
    content = content.replace(/\{\{DATA\}\}/g, today);

    // Auto-fill from lead property if available
    if (lead.properties.length > 0) {
      const prop = lead.properties[0];
      if (!extraFields['{{ENDERECO_IMOVEL}}'] && prop.location) {
        content = content.replace(/\{\{ENDERECO_IMOVEL\}\}/g, prop.location);
      }
      if (!extraFields['{{VALOR_IMOVEL}}'] && prop.value) {
        content = content.replace(/\{\{VALOR_IMOVEL\}\}/g, prop.value.toLocaleString('pt-BR'));
      }
    }

    // Fill extra manual fields
    (Object.entries(extraFields) as [string, string][]).forEach(([key, value]) => {
      if (value.trim()) {
        content = content.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value.trim());
      }
    });

    setGeneratedContent(content);
    setShowGeneratedPreview(true);
  };

  const handleDownloadGenerated = () => {
    if (!generatedContent || !selectedContract) return;
    const lead = leads.find(l => l.id === selectedLeadId);
    const filename = `${selectedContract.title} - ${lead?.name || 'contrato'}`;
    downloadText(generatedContent, filename);
  };

  // ========== RENDER HELPERS ==========

  const ContractCard: React.FC<{ contract: ContractTemplate }> = ({ contract }) => {
    const preview = contract.content.slice(0, 120).replace(/\n/g, ' ') + '...';
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-600">description</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{contract.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Criado em {formatDate(contract.createdAt)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{preview}</p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleView(contract)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Ver
          </button>
          <button
            onClick={() => handleEdit(contract)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Editar
          </button>
          <button
            onClick={() => handleStartGenerate(contract)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Gerar
          </button>
          <button
            onClick={() => setShowDeleteConfirm(contract.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    );
  };

  // ========== LIST VIEW ==========

  const renderList = () => (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-light/80 backdrop-blur-md px-4 pt-6 pb-4 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contratos</h1>
            <p className="text-sm text-slate-500 mt-1">Modelos e documentos</p>
          </div>
          <button
            onClick={handleAdd}
            className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 hover:shadow-xl transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Contracts List */}
      <div className="px-4 md:px-8 space-y-3">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">description</span>
            </div>
            <p className="text-slate-500 font-medium">Nenhum modelo encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Crie seu primeiro modelo de contrato</p>
          </div>
        ) : (
          filteredContracts.map(contract => (
            <ContractCard key={contract.id} contract={contract} />
          ))
        )}

        {/* Placeholder hints */}
        <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-indigo-500 text-lg">info</span>
            <span className="text-sm font-semibold text-indigo-700">Campos variáveis</span>
          </div>
          <p className="text-xs text-indigo-600 leading-relaxed">
            Use placeholders nos modelos para preenchimento automático:
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PLACEHOLDERS.map(p => (
              <span key={p.key} className="px-2 py-0.5 bg-white rounded-md text-[11px] text-indigo-600 font-mono border border-indigo-100">
                {p.key}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ========== VIEW (single contract) ==========

  const renderView = () => {
    if (!selectedContract) return null;
    return (
      <div className="h-full overflow-y-auto pb-24 md:pb-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-light/80 backdrop-blur-md px-4 pt-6 pb-4 md:px-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { setView('list'); setSelectedContract(null); }}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">{selectedContract.title}</h1>
              <p className="text-xs text-slate-400">Atualizado em {formatDate(selectedContract.updatedAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadText(selectedContract.content, selectedContract.title)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Baixar .txt
            </button>
            <button
              onClick={() => handleEdit(selectedContract)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar
            </button>
            <button
              onClick={() => handleStartGenerate(selectedContract)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Gerar para Lead
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-8">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">{selectedContract.content}</pre>
          </div>
        </div>
      </div>
    );
  };

  // ========== EDIT VIEW ==========

  const renderEdit = () => (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-light/80 backdrop-blur-md px-4 pt-6 pb-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedContract) setView('view');
              else setView('list');
            }}
            className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900">Editar Modelo</h1>
          <button
            onClick={handleSaveEdit}
            disabled={!formTitle.trim() || !formContent.trim()}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            Salvar
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 md:px-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome do modelo</label>
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Ex: Contrato de Compra e Venda"
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Conteúdo do contrato</label>
          <textarea
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            placeholder="Digite o texto do contrato aqui. Use {{PLACEHOLDERS}} para campos variáveis..."
            rows={20}
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Placeholder helper */}
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Inserir campo variável:</p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map(p => (
              <button
                key={p.key}
                onClick={() => setFormContent(prev => prev + p.key)}
                className="px-2 py-1 bg-white rounded-lg text-[11px] text-indigo-600 font-mono border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                {p.key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ========== GENERATE VIEW ==========

  const renderGenerate = () => {
    if (!selectedContract) return null;
    const selectedLead = leads.find(l => l.id === selectedLeadId);

    return (
      <div className="h-full overflow-y-auto pb-24 md:pb-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-light/80 backdrop-blur-md px-4 pt-6 pb-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('view'); setShowGeneratedPreview(false); }}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">Gerar Contrato</h1>
              <p className="text-xs text-slate-400">{selectedContract.title}</p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 space-y-4">
          {!showGeneratedPreview ? (
            <>
              {/* Lead Selector */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">person</span>
                  Selecionar Lead
                </h3>
                <select
                  value={selectedLeadId}
                  onChange={e => {
                    setSelectedLeadId(e.target.value);
                    // Auto-fill extra fields from lead
                    const lead = leads.find(l => l.id === e.target.value);
                    if (lead) {
                      const newFields: Record<string, string> = { ...extraFields };
                      if (lead.properties.length > 0) {
                        if (lead.properties[0].location) newFields['{{ENDERECO_IMOVEL}}'] = lead.properties[0].location;
                        if (lead.properties[0].value) newFields['{{VALOR_IMOVEL}}'] = lead.properties[0].value.toLocaleString('pt-BR');
                      }
                      setExtraFields(newFields);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  <option value="">Escolha um lead...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name} — {lead.status}</option>
                  ))}
                </select>

                {selectedLead && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                    <p className="text-sm text-slate-700"><strong>Nome:</strong> {selectedLead.name}</p>
                    <p className="text-sm text-slate-700"><strong>Telefone:</strong> {selectedLead.phone}</p>
                    {selectedLead.email && <p className="text-sm text-slate-700"><strong>Email:</strong> {selectedLead.email}</p>}
                    {selectedLead.properties.length > 0 && (
                      <p className="text-sm text-slate-700"><strong>Imóvel:</strong> {selectedLead.properties[0].title} — {selectedLead.properties[0].location}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Extra Fields */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">edit_note</span>
                  Campos Adicionais
                </h3>
                <p className="text-xs text-slate-400">Preencha os campos que não são preenchidos automaticamente.</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">CPF do Comprador</label>
                    <input
                      type="text"
                      value={extraFields['{{CPF_COMPRADOR}}'] || ''}
                      onChange={e => setExtraFields(prev => ({ ...prev, '{{CPF_COMPRADOR}}': e.target.value }))}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Endereço do Imóvel</label>
                    <input
                      type="text"
                      value={extraFields['{{ENDERECO_IMOVEL}}'] || ''}
                      onChange={e => setExtraFields(prev => ({ ...prev, '{{ENDERECO_IMOVEL}}': e.target.value }))}
                      placeholder="Rua, número, bairro, cidade"
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Valor do Imóvel</label>
                    <input
                      type="text"
                      value={extraFields['{{VALOR_IMOVEL}}'] || ''}
                      onChange={e => setExtraFields(prev => ({ ...prev, '{{VALOR_IMOVEL}}': e.target.value }))}
                      placeholder="1.500.000"
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!selectedLeadId}
                className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm shadow-lg shadow-accent/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                Gerar Contrato
              </button>
            </>
          ) : (
            <>
              {/* Generated Preview */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    Contrato Gerado
                  </h3>
                  <span className="text-xs text-slate-400">{selectedLead?.name}</span>
                </div>

                {/* Check if there are unfilled placeholders */}
                {generatedContent.includes('{{') && (
                  <div className="bg-amber-50 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
                    <p className="text-xs text-amber-700">Alguns campos variáveis não foram preenchidos. Revise o contrato antes de baixar.</p>
                  </div>
                )}

                <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">{generatedContent}</pre>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGeneratedPreview(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Voltar
                </button>
                <button
                  onClick={handleDownloadGenerated}
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold text-sm shadow-lg shadow-accent/30 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Baixar .txt
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ========== MODALS ==========

  const renderAddModal = () => {
    if (!showAddModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
        <div className="relative w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
          <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-900">Novo Modelo</h2>
            <button onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Nome do modelo *</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Ex: Contrato de Locação Comercial"
                className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Conteúdo *</label>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Digite o texto do contrato. Use {{PLACEHOLDERS}} para campos variáveis..."
                rows={12}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y font-mono leading-relaxed"
              />
            </div>

            {/* Placeholder quick-insert */}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Inserir campo:</p>
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setFormContent(prev => prev + p.key)}
                    className="px-2 py-1 bg-white rounded-lg text-[11px] text-indigo-600 font-mono border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    {p.key}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveNew}
              disabled={!formTitle.trim() || !formContent.trim()}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm shadow-lg shadow-accent/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            >
              Salvar Modelo
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm) return null;
    const contract = contracts.find(c => c.id === showDeleteConfirm);
    if (!contract) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
        <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-[slideUp_0.2s_ease-out]">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
          </div>
          <h3 className="text-center font-bold text-slate-900 mb-1">Excluir modelo?</h3>
          <p className="text-center text-sm text-slate-500 mb-6">"{contract.title}" será removido permanentemente.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========

  return (
    <div className="h-full relative">
      {view === 'list' && renderList()}
      {view === 'view' && renderView()}
      {view === 'edit' && renderEdit()}
      {view === 'generate' && renderGenerate()}

      {renderAddModal()}
      {renderDeleteConfirm()}
    </div>
  );
};

export default Contratos;
