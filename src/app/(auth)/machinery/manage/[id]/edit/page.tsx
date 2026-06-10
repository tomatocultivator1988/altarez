import { createClient } from "@/lib/supabase/server"
import { MachineryForm } from "@/components/machinery/machinery-form"

export default async function EditMachineryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: m } = await supabase
    .from("machinery")
    .select("*")
    .eq("id", id)
    .single()

  if (!m) return <div className="py-16 text-center">Machinery not found</div>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Machinery</h1>
      <MachineryForm machinery={m} />
    </div>
  )
}
