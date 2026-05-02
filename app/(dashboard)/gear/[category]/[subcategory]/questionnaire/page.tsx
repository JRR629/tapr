export default function SubcategoryQuestionnairePage({ params }: { params: { category: string; subcategory: string } }) {
  return <div className="flex-1 p-8"><h1 className="font-display text-5xl text-white uppercase">Questionnaire — {params.subcategory}</h1></div>
}
