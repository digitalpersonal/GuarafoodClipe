import React, { useState } from 'react';
import { PartnerRestaurant } from '../types/clip';
import { Store, Tag, Play, Plus, X, Check, Utensils, Edit2, Trash2 } from 'lucide-react';

interface PartnerSpotlightProps {
  currentTime: number;
  onSeek: (time: number) => void;
  partners: PartnerRestaurant[];
  onAddPartner: (newPartner: PartnerRestaurant) => void;
  onUpdatePartner?: (updatedPartner: PartnerRestaurant) => void;
  onDeletePartner?: (partnerId: string) => void;
}

export const PartnerSpotlight: React.FC<PartnerSpotlightProps> = ({
  currentTime,
  onSeek,
  partners,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hamburgueria');
  const [specialty, setSpecialty] = useState('');
  const [discountBadge, setDiscountBadge] = useState('10% OFF no App');
  const [timeMark, setTimeMark] = useState(48);
  const [icon, setIcon] = useState('🍔');

  const availableIcons = ['🍔', '🍕', '🍧', '🥟', '🍣', '🥩', '🌮', '🌭', '🥗', '🍩', '🍹', '🍱'];

  const handleOpenAddModal = () => {
    setEditingPartnerId(null);
    setName('');
    setCategory('Hamburgueria');
    setSpecialty('');
    setDiscountBadge('10% OFF no App');
    setTimeMark(48);
    setIcon('🍔');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (partner: PartnerRestaurant) => {
    setEditingPartnerId(partner.id);
    setName(partner.name);
    setCategory(partner.category || 'Hamburgueria');
    setSpecialty(partner.specialty);
    setDiscountBadge(partner.discountBadge);
    setTimeMark(partner.timeMark);
    setIcon(partner.icon);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPartnerId) {
      // Edit existing
      const updated: PartnerRestaurant = {
        id: editingPartnerId,
        name: name.trim(),
        category,
        specialty: specialty.trim() || 'Pratos Especiais & Entrega Rápida',
        icon,
        discountBadge: discountBadge.trim() || 'Desconto GuaraFood',
        timeMark: Number(timeMark) || 45,
      };
      if (onUpdatePartner) {
        onUpdatePartner(updated);
      }
    } else {
      // Create new
      const newPartner: PartnerRestaurant = {
        id: `partner-${Date.now()}`,
        name: name.trim(),
        category,
        specialty: specialty.trim() || 'Pratos Especiais & Entrega Rápida',
        icon,
        discountBadge: discountBadge.trim() || 'Desconto GuaraFood',
        timeMark: Number(timeMark) || 45,
      };
      onAddPartner(newPartner);
    }

    setName('');
    setSpecialty('');
    setEditingPartnerId(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeletePartner) {
      onDeletePartner(id);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-white tracking-wide font-heading">
            Restaurantes Parceiros Oficiais & Lojas
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {partners.length} Parceiros Cadastrados
          </span>

          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Parceiro</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Clique em qualquer restaurante para ir ao momento de destaque no clipe, ou use os botões para editar ou remover:
      </p>

      {/* PARTNER CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {partners.map((partner) => {
          const isMentionedNow =
            currentTime >= partner.timeMark && currentTime < partner.timeMark + 2.5;

          return (
            <div
              key={partner.id}
              onClick={() => onSeek(partner.timeMark)}
              className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                isMentionedNow
                  ? 'bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-slate-900 border-amber-500 ring-2 ring-amber-500/50 scale-[1.02] shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 group-hover:scale-110 transition-transform">
                  {partner.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-extrabold text-white truncate group-hover:text-amber-400 font-heading">
                      {partner.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-0.5">
                      <Play className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {partner.timeMark}s
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                    {partner.specialty}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Tag className="w-2.5 h-2.5" />
                      {partner.discountBadge}
                    </span>
                  </div>
                </div>
              </div>

              {/* EDIT & DELETE ACTIONS */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(partner);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors border border-slate-800"
                >
                  <Edit2 className="w-3 h-3 text-amber-400" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={(e) => handleDelete(partner.id, e)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 text-[11px] font-bold flex items-center gap-1 transition-colors border border-slate-800"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT PARTNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white font-heading">
                  {editingPartnerId ? 'Editar Restaurante Parceiro' : 'Cadastrar Novo Restaurante'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cantina do Lago"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hamburgueria">Hamburgueria</option>
                    <option value="Pizzaria">Pizzaria</option>
                    <option value="Açaíteria">Açaíteria</option>
                    <option value="Pastelaria">Pastelaria</option>
                    <option value="Japonesa">Comida Japonesa</option>
                    <option value="Churrascaria">Churrascaria</option>
                    <option value="Sobremesas">Sobremesas & Doces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tempo no Clipe (segundos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={timeMark}
                    onChange={(e) => setTimeMark(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Especialidade / Prato Destaque
                </label>
                <input
                  type="text"
                  placeholder="Ex: Smash Burger duplo com bacon crocante"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cupom / Benefício no App
                </label>
                <input
                  type="text"
                  placeholder="Ex: Frete Grátis ou Cupom LAGO10"
                  value={discountBadge}
                  onChange={(e) => setDiscountBadge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ícone
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {availableIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`text-xl p-2 rounded-xl border transition-all ${
                        icon === ic
                          ? 'bg-amber-500/20 border-amber-500 scale-110'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {editingPartnerId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
