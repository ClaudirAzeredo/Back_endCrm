"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useApiTags } from "@/hooks/use-api-tags"
import { Tag } from "@/lib/api/tags-api"

type TagInputProps = {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({
  selectedTags,
  onTagsChange,
  placeholder = "Digite para buscar ou criar tags...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { tags: availableTags, fetchTags, createTag } = useApiTags()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(
        (tag) => tag.name.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag.id),
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, availableTags, selectedTags])

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.includes(tag.id)) {
      onTagsChange([...selectedTags, tag.id])
    }
    setInputValue("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleCreateTag = async () => {
    if (!inputValue.trim()) return

    const existingTag = availableTags.find((tag) => tag.name.toLowerCase() === inputValue.toLowerCase())

    if (existingTag) {
      handleTagSelect(existingTag)
      return
    }

    try {
      const newTag = await createTag({
        name: inputValue.trim(),
      })

      onTagsChange([...selectedTags, newTag.id])
      setInputValue("")
      setShowSuggestions(false)
      inputRef.current?.focus()
    } catch (error) {
      console.error("Failed to create tag", error)
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (suggestions.length > 0) {
        handleTagSelect(suggestions[0])
      } else {
        handleCreateTag()
      }
    }
  }

  const selectedTagObjects = availableTags.filter((tag) => selectedTags.includes(tag.id))

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />

        {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                onClick={() => handleTagSelect(tag)}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}

            {inputValue.trim() && !suggestions.some((tag) => tag.name.toLowerCase() === inputValue.toLowerCase()) && (
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                onClick={handleCreateTag}
              >
                <Plus className="w-3 h-3" />
                Criar "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>

      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color, color: "white" }}
              className="flex items-center gap-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
