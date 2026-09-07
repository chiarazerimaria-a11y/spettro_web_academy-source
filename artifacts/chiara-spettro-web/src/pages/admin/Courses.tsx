import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, getListCoursesQueryKey, Course, CourseLevel } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Terminal, BookOpen, Clock, Video, Eye, EyeOff } from "lucide-react";

export default function Courses() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: courses, isLoading } = useListCourses();
  
  const createCourse = useCreateCourse({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCoursesQueryKey() }); toast({ title: "Curso creado" }); setCreateOpen(false); } } });
  const updateCourse = useUpdateCourse({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCoursesQueryKey() }); toast({ title: "Curso actualizado" }); setEditOpen(false); setEditingCourse(null); } } });
  const deleteCourse = useDeleteCourse({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListCoursesQueryKey() }); toast({ title: "Curso eliminado" }); } } });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCourse.mutate({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        level: formData.get("level") as CourseLevel,
        durationHours: Number(formData.get("durationHours")),
        price: Number(formData.get("price")),
        videoUrl: (formData.get("videoUrl") as string) || null,
        published: formData.get("published") === "on",
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCourse) return;
    const formData = new FormData(e.currentTarget);
    updateCourse.mutate({
      id: editingCourse.id,
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        level: formData.get("level") as CourseLevel,
        durationHours: Number(formData.get("durationHours")),
        price: Number(formData.get("price")),
        videoUrl: (formData.get("videoUrl") as string) || null,
        published: formData.get("published") === "on",
      }
    });
  };

  const togglePublish = (course: Course) => {
    updateCourse.mutate({
      id: course.id,
      data: { published: !course.published }
    });
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "principiante": return <Badge className="bg-primary/20 text-primary border-primary/50">Principiante</Badge>;
      case "intermedio": return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50">Intermedio</Badge>;
      case "avanzado": return <Badge className="bg-secondary/20 text-secondary border-secondary/50">Avanzado</Badge>;
      default: return <Badge>{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
            <span className="text-secondary animate-pulse">&gt;</span> System.Courses
          </h1>
          <p className="text-muted-foreground">Catálogo de cursos y módulos de entrenamiento.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,77,184,0.3)] px-6 h-12 text-lg">
              <Plus className="mr-2 h-5 w-5" /> Cargar nuevo curso
            </Button>
          </DialogTrigger>
          <DialogContent className="border-primary/50 bg-card max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono text-primary flex items-center gap-2">
                <Terminal className="h-4 w-4" /> root@upload_course
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Curso</Label>
                <Input id="title" name="title" required className="bg-background/50 border-primary/30 font-mono text-lg" placeholder="Ej: Fundamentos de Pentesting" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" required className="bg-background/50 border-primary/30 h-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Select name="level" defaultValue="principiante">
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationHours">Duración (Horas)</Label>
                  <Input id="durationHours" name="durationHours" type="number" min="1" required className="bg-background/50 border-primary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input id="price" name="price" type="number" min="0" step="0.01" required className="bg-background/50 border-primary/30 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL del Video (Trailer/Intro)</Label>
                <Input id="videoUrl" name="videoUrl" placeholder="https://youtube.com/..." className="bg-background/50 border-primary/30" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="published" name="published" defaultChecked />
                <Label htmlFor="published">Publicar inmediatamente</Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createCourse.isPending} className="bg-primary text-primary-foreground">
                  {createCourse.isPending ? "Guardando..." : "Subir al Sistema"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-card/40 border-primary/20 h-[300px] flex flex-col">
              <CardContent className="pt-6 flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-primary/30 rounded-lg bg-card/20">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-mono text-primary/70 mb-2">Directorio de cursos vacío</h3>
          <p className="text-muted-foreground mb-6">Carga tu primer módulo de entrenamiento al sistema.</p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="border-primary/50 hover:bg-primary/10">
            Inicializar Catálogo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <Card key={course.id} className="bg-card/40 border-primary/20 hover:border-primary/50 transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  {getLevelBadge(course.level)}
                  {course.published ? (
                    <Badge className="bg-primary/10 text-primary border-primary/50 shadow-[0_0_10px_rgba(255,77,184,0.2)]">Publicado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Borrador</Badge>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold font-mono tracking-tight mb-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{course.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-4 bg-background/50 p-2 rounded border border-border/50">
                  <div className="flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {course.durationHours}h</div>
                  {course.videoUrl && <div className="flex items-center gap-1"><Video className="h-4 w-4 text-secondary" /> Media</div>}
                </div>
                
                <div className="text-3xl font-mono font-bold text-foreground">
                  <span className="text-primary mr-1">€</span>{course.price.toFixed(2)}
                </div>
              </CardContent>
              <CardFooter className="border-t border-primary/10 bg-background/30 p-3 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30"
                  onClick={() => { setEditingCourse(course); setEditOpen(true); }}
                >
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex-1 border border-transparent ${course.published ? 'hover:bg-amber-500/20 hover:text-amber-500 hover:border-amber-500/30 text-muted-foreground' : 'hover:bg-primary/20 hover:text-primary hover:border-primary/30 text-primary/70'}`}
                  onClick={() => togglePublish(course)}
                >
                  {course.published ? <><EyeOff className="h-4 w-4 mr-2" /> Ocultar</> : <><Eye className="h-4 w-4 mr-2" /> Publicar</>}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-destructive/20 hover:text-destructive border border-transparent hover:border-destructive/30">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-destructive/50 bg-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <Terminal className="h-4 w-4" /> sudo rm -rf /courses/{course.id}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Eliminar permanentemente el curso <span className="font-bold text-foreground">{course.title}</span>?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-primary/20 hover:bg-primary/10">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteCourse.mutate({ id: course.id })}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if(!open) setEditingCourse(null); }}>
        <DialogContent className="border-primary/50 bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary flex items-center gap-2">
              <Terminal className="h-4 w-4" /> root@edit_course --id={editingCourse?.id}
            </DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título del Curso</Label>
                <Input id="edit-title" name="title" defaultValue={editingCourse.title} required className="bg-background/50 border-primary/30 font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea id="edit-description" name="description" defaultValue={editingCourse.description} required className="bg-background/50 border-primary/30 h-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Nivel</Label>
                  <Select name="level" defaultValue={editingCourse.level}>
                    <SelectTrigger className="bg-background/50 border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">Principiante</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-durationHours">Duración (Horas)</Label>
                  <Input id="edit-durationHours" name="durationHours" type="number" min="1" defaultValue={editingCourse.durationHours} required className="bg-background/50 border-primary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio (€)</Label>
                  <Input id="edit-price" name="price" type="number" min="0" step="0.01" defaultValue={editingCourse.price} required className="bg-background/50 border-primary/30 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-videoUrl">URL del Video</Label>
                <Input id="edit-videoUrl" name="videoUrl" defaultValue={editingCourse.videoUrl || ""} className="bg-background/50 border-primary/30" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="edit-published" name="published" defaultChecked={editingCourse.published} />
                <Label htmlFor="edit-published">Curso publicado</Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={updateCourse.isPending} className="bg-primary text-primary-foreground">
                  {updateCourse.isPending ? "Guardando..." : "Actualizar Curso"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
