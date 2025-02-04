import { Card, CardContent } from "@/components/ui/card"

interface AffirmationPostProps {
  content: string
}

export function AffirmationPost({ content }: AffirmationPostProps) {
  return (
    <Card className="w-full h-full bg-gradient-to-br from-[#f9eeec] to-[#e7bab2] flex items-center justify-center">
      <CardContent className="text-center p-6">
        <h3 className="text-2xl font-bold text-foreground mb-4">Affirmation</h3>
        <p className="text-xl text-muted-foreground italic">{content}</p>
      </CardContent>
    </Card>
  )
}

