import { useState } from "react"

interface Props {
  onFilter: (filters: {
    levelAIAS?: string
    discipline?: string
    activityType?: string
  }) => void
}

export default function ResourceFilters({ onFilter }: Props) {

  const [levelAIAS, setLevelAIAS] = useState("")
  const [discipline, setDiscipline] = useState("")
  const [activityType, setActivityType] = useState("")

  const applyFilters = () => {
    onFilter({
      levelAIAS: levelAIAS || undefined,
      discipline: discipline || undefined,
      activityType: activityType || undefined
    })
  }

  return (
    <div>

      <h3>Filtros</h3>

      <select value={levelAIAS} onChange={(e) => setLevelAIAS(e.target.value)}>
        <option value="">Nivel AIAS</option>
        <option value="BEGINNER">Principiante</option>
        <option value="INTERMEDIATE">Intermedio</option>
        <option value="ADVANCED">Avanzado</option>
      </select>

      <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
        <option value="">Disciplina</option>
        <option value="Engineering">Ingeniería</option>
        <option value="Medicine">Medicina</option>
        <option value="Business">Negocios</option>
      </select>

      <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
        <option value="">Tipo de actividad</option>
        <option value="Workshop">Taller</option>
        <option value="Lecture">Clase magistral</option>
        <option value="Project">Proyecto</option>
      </select>

      <button onClick={applyFilters}>
        Aplicar filtros
      </button>

    </div>
  )
}