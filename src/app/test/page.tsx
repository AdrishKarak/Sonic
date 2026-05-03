import { prisma } from "@/lib/db"

export default async function TestPage() {
    const voices = await prisma.voice.findMany()
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">
                Voices ({voices.length})
            </h1>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {voices.map((voice) => (
                    <li key={voice.id} className="bg-white p-4 rounded-lg shadow">
                        <span className="font-semibold">{voice.name}</span>
                        <p className="text-sm text-red-500">{voice.variant}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}               