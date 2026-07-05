import React, { useState } from "react";
import { Bell, BellRing, Target, Activity, ShieldAlert, Plus, Trash2, Zap } from "lucide-react";
import { AlertConfig, AssetId } from "../types";
import { ASSETS_METADATA } from "../data";

export default function AlertEngine({ alerts, setAlerts }: { alerts: AlertConfig[], setAlerts: any }) {
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
    type: "PRICE_ABOVE",
    assetId: "MELTED_GOLD",
    targetValue: 0
  });

  return (
    <div className="space-y-6 text-right">
      <div className="glass-panel lux-card lux-breathe p-6 rounded-2xl border-white/5 bg-black/20">
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <div>
            <h2 className="font-display text-2xl text-[var(--accent-gold)] font-bold">موتور هشدارهای پیشرفته (Alert Engine)</h2>
            <p className="text-xs text-gray-500 mt-1">مانیتورینگ هوشمند، تشخیص شکست‌ها و هشدارهای سیستمی</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="lux-button lux-button-primary px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            تعریف هشدار جدید
          </button>
        </div>

        {showForm && (
          <div className="bg-black/40 border border-[var(--accent-gold)]/20 p-4 rounded-xl mb-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                   <label className="text-[10px] data-label text-gray-400 block mb-1">دارایی پایه</label>
                   <select 
                     value={newAlert.assetId} 
                     onChange={(e) => setNewAlert({...newAlert, assetId: e.target.value as AssetId})}
                     className="w-full bg-gray-950 border border-white/10 rounded p-2 text-xs"
                   >
                     {Object.keys(ASSETS_METADATA).map(k => (
                       <option key={k} value={k}>{ASSETS_METADATA[k as AssetId].persianName}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] data-label text-gray-400 block mb-1">نوع تریگر</label>
                   <select 
                     value={newAlert.type} 
                     onChange={(e) => setNewAlert({...newAlert, type: e.target.value as any})}
                     className="w-full bg-gray-950 border border-white/10 rounded p-2 text-xs"
                   >
                     <option value="PRICE_ABOVE">عبور قیمت به بالا (Breakout)</option>
                     <option value="PRICE_BELOW">ریزش قیمت به پایین (Breakdown)</option>
                     <option value="TREND_CHANGE">تغییر روند هوش مصنوعی (SMC)</option>
                     <option value="VOLATILITY_SPIKE">شوک نوسانی (Volatility Spike)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[10px] data-label text-gray-400 block mb-1">مقدار هدف / آستانه</label>
                   <input 
                     type="number" 
                     value={newAlert.targetValue || ""} 
                     onChange={(e) => setNewAlert({...newAlert, targetValue: parseFloat(e.target.value)})}
                     className="w-full bg-gray-950 border border-white/10 rounded p-2 text-xs data-value text-[11px] text-left direction-ltr"
                     placeholder="0.00"
                   />
                </div>
             </div>
             <div className="mt-4 flex justify-end gap-3">
               <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white transition">انصراف</button>
               <button 
                 onClick={() => {
                   setAlerts([...alerts, { ...newAlert, id: Date.now().toString(), active: true, createdAt: Date.now().toString() }]);
                   setShowForm(false);
                 }}
                 className="lux-button px-4 py-2 rounded-lg text-xs"
               >
                 فعال‌سازی سیستم مانیتورینگ
               </button>
             </div>
          </div>
        )}

        {alerts.length === 0 ? (
           <div className="py-12 text-center text-gray-500 text-xs border border-dashed border-white/10 rounded-xl bg-black/10">
              هیچ هشدار فعالی در موتور مانیتورینگ ثبت نشده است.
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {alerts.map((al) => (
               <div key={al.id} className={`p-4 rounded-xl border transition ${al.active ? 'bg-[var(--accent-gold)]/5 border-[var(--accent-gold)]/30' : 'bg-black/20 border-white/5'}`}>
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2">
                     <BellRing className={`h-4 w-4 ${al.active ? 'text-[var(--accent-gold)] animate-pulse' : 'text-gray-600'}`} />
                     <div>
                       <h4 className="text-xs font-bold text-white">{ASSETS_METADATA[al.assetId as AssetId]?.persianName || al.assetId}</h4>
                       <p className="text-[9px] data-label text-gray-400 mt-1 uppercase">
                         {al.type === "PRICE_ABOVE" ? "صعود بالای" : al.type === "PRICE_BELOW" ? "نزول زیر" : al.type === "TREND_CHANGE" ? "تغییر روند" : "شوک نوسانی"}
                         {al.targetValue ? ` : ${al.targetValue.toLocaleString()}` : ""}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setAlerts(alerts.map(a => a.id === al.id ? { ...a, active: !a.active } : a))}
                       className={`px-2 py-1 text-[9px] rounded font-bold ${al.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}
                     >
                       {al.active ? "روشن" : "خاموش"}
                     </button>
                     <button 
                       onClick={() => setAlerts(alerts.filter(a => a.id !== al.id))}
                       className="p-1 text-gray-600 hover:text-rose-400 transition"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  )
}
