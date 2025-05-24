'use client';

interface GiftCardProps {
  amount: number;
  message?: string;
  sender?: string;
  recipient?: string;
}

export function GiftCard({ amount, message, sender, recipient }: GiftCardProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-sm w-full">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800">{amount} GUI</h3>
          {message && (
            <p className="mt-2 text-gray-600 italic">&quot;{message}&quot;</p>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          {sender && <p>From: {sender.slice(0, 6)}...{sender.slice(-4)}</p>}
          {recipient && <p>To: {recipient.slice(0, 6)}...{recipient.slice(-4)}</p>}
        </div>
        
        <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          {recipient ? 'Claim Gift' : 'Send Gift'}
        </button>
      </div>
    </div>
  );
}
