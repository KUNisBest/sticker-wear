export default function Recommend() {
  return (
    <div
      className="min-h-full flex flex-col items-center justify-center bg-white"
      style={{ paddingTop: '15vh' }}
    >
      <div
        className="text-4xl tracking-wider mb-4"
        style={{
          fontFamily: "'League Spartan', 'Inter', sans-serif",
          color: '#000',
          fontWeight: 900,
        }}
      >
        STICKER WEAR
      </div>
      <div
        className="text-lg tracking-[6px] mb-8"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: '#999',
        }}
      >
        COMING SOON
      </div>
      <div
        className="w-16 h-[1px] mb-8"
        style={{ background: 'rgba(0,0,0,0.1)' }}
      />
      <div
        className="text-sm tracking-wider"
        style={{
          fontFamily: "'Inter', sans-serif",
          color: '#bbb',
        }}
      >
        敬请期待
      </div>
    </div>
  );
}
