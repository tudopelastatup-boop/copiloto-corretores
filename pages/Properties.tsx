import React from 'react';
import { Property } from '../types';

const Properties: React.FC = () => {
  const properties: Property[] = [
    {
      id: '1', title: 'The Horizon Penthouse', location: 'Downtown District', price: '$5,200,000', beds: 4, baths: 4.5, sqft: 4200,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTXKQkMbrT8olyM5C2Iije7HYJjsQivRO7AtwW2h6Zkyg1JVm07XcLRZhv5qCsNSDQr9RCQOXfSPkg6Jy95v2TralMq0G1uJbpzuu8D_-3IyrjvL82g_pXo8gJh7Xfgp5O0EzYfwDC6JOtBQ4_XvtBnatRzM4fyvdncZ0FiOLieQGEqg-ysPjIwm-jTq-AsIzMgryBhdYErIbwpS0AsMjY0RnwNrQlTaDmJ0lGiARvhpeyh4QKOdnPJdBPyy6JiaaboSQtCvvoAho',
      tag: 'New Listing'
    },
    {
      id: '2', title: '1040 Park Avenue', location: 'Upper East Side', price: '$2,500,000', beds: 3, baths: 3, sqft: 2100,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzNcSCRS0SXY_jH2kIJzCZA20sduUg1JmS5JYe7UB56REl3jVP78mIVN5VNkih9JqJ1Y9gqi2T5k64wL6zHgrSQ4NIqIWgmtvOsH5jM3zpivafo8HFnoFyosu3lA2A2BJ5dY3BDCRNTw8edkIcZubMS6tSOEabg_-uwmNYZ-L8p2oTQ6jPaP2tGQtMmSbG4UkM06Wdp2WScw5gdNk40n4McwUZQL2x6X0sH-J9qRntsWtTPU98SuVlp3JnYx6i4XqFX47m3dVXiu4',
      tag: 'Negotiation'
    },
    {
      id: '3', title: 'Sunny 2-Bed Apt w/ Balcony', location: 'Downtown, Main St.', price: '$450,000', beds: 2, baths: 2, sqft: 980,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtcSDBFLKHwujcSNksisunUA2y4Zz2fpbhl2gtP8eLVlvo6v2gEKIuW-lCCVHE50Uj4LuKiQzHHwRuEz3tzqTcocQVSWzIsWAZ9MkXBAOBqg0bdZ6J9vRjAlHP7-TcSdpjd19zS7jx3AabTnN0eNPFdEjdubFwviwS3VxpHhUynESd7pYI1h_szTHOntmCOIagLPMHmhzNCf14Gj0BOerCJoK6SZ6nl00hzEh8ceMf_9RmjEnvDWEwyRe5YZmBNAekm_Esv1xV3BI'
    },
    {
       id: '4', title: 'Modern Loft', location: 'Arts District', price: '$890,000', beds: 1, baths: 1.5, sqft: 1200,
       image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm53HVXWE47bPwEc2Goqa7PQq733ATr6IvJncKVUcx0cG44Fq5N1mwsDg7AYWSX5fzGZfhgoFF1wc_I_YBgGqJHBd7u1zKKrM87mwFhKGtcYcJgbqW9iym3DIufYwrp_bdD2IvFfITgKcGttYmr4ar182REkZs2i4sfysaceL5lbwuA6ftJgYJHC4Gfb7k3ArYdHMfzcOVmGB4MDJDiEpCbyK0eXKRE_PO0FACn0j1_UaL9VrC4fn7GXF4AoFQw8TZuAlF6zKTAr4',
       tag: '-5% Price Drop'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-light overflow-hidden">
       <div className="px-5 pt-12 md:pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
          <div className="flex justify-between items-end">
             <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Properties</h1>
                <p className="text-slate-500 text-sm">Manage your listings and viewing availability.</p>
             </div>
             <button className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-slate-800 transition-colors">
                Add Listing
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-6 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {properties.map(property => (
                <div key={property.id} className="group bg-white rounded-2xl overflow-hidden shadow-soft border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                   <div className="relative h-64 w-full overflow-hidden">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                      
                      {property.tag && (
                          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
                             <span className="text-xs font-bold text-primary uppercase tracking-wider">{property.tag}</span>
                          </div>
                      )}
                      
                      <div className="absolute bottom-4 left-4 text-white">
                         <p className="text-2xl font-bold tracking-tight">{property.price}</p>
                         <p className="text-sm font-medium opacity-90 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">location_on</span> {property.location}
                         </p>
                      </div>
                   </div>
                   
                   <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{property.title}</h3>
                      
                      <div className="flex items-center justify-between py-4 border-t border-slate-100 mt-2">
                         <div className="flex gap-4 text-slate-500">
                            <span className="flex items-center gap-1 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-accent">bed</span> {property.beds}</span>
                            <span className="flex items-center gap-1 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-accent">bathtub</span> {property.baths}</span>
                            <span className="flex items-center gap-1 text-sm font-medium"><span className="material-symbols-outlined text-[18px] text-accent">square_foot</span> {property.sqft}</span>
                         </div>
                         <button className="h-8 w-8 rounded-full bg-slate-50 hover:bg-accent hover:text-white transition-colors flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                         </button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default Properties;