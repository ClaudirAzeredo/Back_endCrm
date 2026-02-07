import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Check, Plus, Tag as TagIcon, X } from 'lucide-react';
import { cn } from "@/lib/utils"
import { useApiTags } from '@/hooks/use-api-tags';
import { Tag } from '@/lib/api/tags-api';

interface TagSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagSelectionDialog({
  open,
  onOpenChange,
  selectedTagIds,
  onTagsChange,
}: TagSelectionDialogProps) {
  const { tags: availableTags, fetchTags, createTag } = useApiTags();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  const handleCreateTag = async () => {
    const tagName = searchValue.trim();
    if (!tagName) return;

    // Check if tag already exists (case insensitive)
    const existingTag = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (existingTag) {
      if (!selectedTagIds.includes(existingTag.id)) {
        onTagsChange([...selectedTagIds, existingTag.id]);
      }
      setSearchValue("");
      return;
    }

    try {
      const newTag = await createTag({ name: tagName });
      onTagsChange([...selectedTagIds, newTag.id]);
      setSearchValue("");
    } catch (error) {
      console.error("Failed to create tag", error);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const getSelectedTags = () => {
    return selectedTagIds.map(id => {
      const tag = availableTags.find(t => t.id === id);
      return tag || { id, name: id, color: '#3b82f6' } as Tag; // Fallback for ID-only tags
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Vincular Tags
          </DialogTitle>
          <DialogDescription>
            Busque tags existentes ou crie novas para segmentar seus leads.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted/20 border-b">
           <Label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
             Tags Selecionadas
           </Label>
           <div className="flex flex-wrap gap-2 min-h-[32px]">
             {selectedTagIds.length === 0 ? (
               <span className="text-sm text-muted-foreground italic">Nenhuma tag selecionada</span>
             ) : (
               getSelectedTags().map(tag => (
                 <Badge 
                    key={tag.id} 
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="gap-1 pr-1 hover:opacity-90"
                 >
                   {tag.name}
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-3 w-3 hover:bg-transparent text-white"
                     onClick={(e) => {
                       e.stopPropagation();
                       toggleTag(tag.id);
                     }}
                   >
                     <X className="h-3 w-3" />
                   </Button>
                 </Badge>
               ))
             )}
           </div>
        </div>

        <Command className="overflow-hidden border-t bg-transparent">
          <CommandInput 
            placeholder="Buscar ou criar tag..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {searchValue.trim() ? (
                <div className="flex flex-col items-center gap-2">
                  <span>Nenhuma tag encontrada.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1"
                    onClick={handleCreateTag}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar "{searchValue}"
                  </Button>
                </div>
              ) : (
                "Digite para buscar..."
              )}
            </CommandEmpty>
            <CommandGroup heading="Tags Disponíveis">
              {availableTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => {
                    toggleTag(tag.id);
                    setSearchValue("");
                  }}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                    selectedTagIds.includes(tag.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-primary opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {searchValue.trim() && !availableTags.some(t => t.name.toLowerCase() === searchValue.trim().toLowerCase()) && (
               <CommandGroup heading="Ações">
                 <CommandItem onSelect={handleCreateTag} value={`create-${searchValue}`}>
                   <Plus className="mr-2 h-4 w-4" />
                   Criar tag "{searchValue}"
                 </CommandItem>
               </CommandGroup>
            )}
          </CommandList>
        </Command>
        
        <div className="flex justify-end p-4 border-t bg-muted/10">
          <Button onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
