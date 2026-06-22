import { MachineryForm } from "@/components/machinery/machinery-form"

export default function NewMachineryPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Add Machinery</h1>
      <MachineryForm />
    </div>
  )
}
