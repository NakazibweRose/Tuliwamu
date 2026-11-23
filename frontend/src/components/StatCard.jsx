
function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="bg-teal-50 text-[#367C78] p-2 rounded-lg">
          <Icon size={20} />
        </div>
      </div>

      <h3 className="text-3xl font-bold text-[#19324D] mt-4">
        {value}
      </h3>

      <p className="text-xs text-slate-500 mt-2">
        {description}
      </p>
    </div>
  );
}

export default StatCard;
