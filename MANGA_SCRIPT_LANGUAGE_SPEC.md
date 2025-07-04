# Manga Script Language Specification v2.0

## Overview

The Manga Script Language v2.0 is a hierarchical markup language designed for creating structured manga dialogues with chapter and scene organization. The language follows a three-tier structure: **Chapters** → **Scenes** → **Dialogues**.

## Syntax Structure

### 1. Chapters

**Definition**: Top-level organizational unit representing a story chapter or section.

**Syntax**:

```
# <chapter-name>
```

**Rules**:

- Must start with `#` symbol
- Followed by exactly one space character
- Chapter name continues until end of line
- Chapter name cannot be empty
- Chapter declaration ends with newline character
- Chapter names are case-sensitive
- No nesting of chapters allowed

**Valid Examples**:

```
# Chapter 1: The Beginning
# Prologue
# The Final Battle
# Act I: Setting the Stage
```

**Invalid Examples**:

```
#Chapter 1          // Missing space after #
#                   // Empty chapter name
# Chapter 1: # Sub  // Contains # in name
```

### 2. Scenes

**Definition**: Mid-level organizational unit representing a specific scene within a chapter.

**Syntax**:

```
* <scene-name>: <scene-description>
```

**Rules**:

- Must start with `*` symbol
- Followed by exactly one space character
- Scene name cannot contain `:` character
- Scene name followed by `:` and exactly one space
- Scene description continues until end of line
- Scene description cannot be empty
- Scene declaration ends with newline character
- Scenes must be within a chapter (cannot exist independently)
- Scene names are case-sensitive within a chapter

**Valid Examples**:

```
* Opening Scene: The hero stands on a cliff overlooking the city at sunset
* Confrontation: Two characters face off in an abandoned warehouse
* Revelation: The truth about the protagonist's past is revealed
* Battle Begin: Lightning crashes as the final battle commences
```

**Invalid Examples**:

```
*Opening Scene: Description    // Missing space after *
* Scene: Name: Description     // Colon in scene name
* Scene:                       // Empty description
* Scene: Des: cription         // Multiple colons
```

### 3. Dialogues

**Definition**: Individual character dialogue with type and optional positioning.

**Syntax**:

```
<character-name>: <dialogue-type>: <dialogue-text>
<character-name>: <dialogue-type>: {<x>,<y>} <dialogue-text>
```

**Rules**:

- Character name cannot contain `:` character
- Character name cannot be empty
- Followed by `:` and exactly one space
- Dialogue type must be one of: `speech`, `thought`, `shout`, `whisper`, `narrator`
- Dialogue type followed by `:` and exactly one space
- Optional position format: `{<x>,<y>}` where x,y are integers 0-2000
- Position (if present) followed by exactly one space
- Dialogue text continues until end of line
- Dialogue text can be empty (for silent panels/actions)
- Dialogues must be within a scene
- Character names are case-sensitive within a scene

**Valid Examples**:

```
Kenji: speech: We have to find her before it's too late!
Yumi: thought: Should I reveal myself?
Ryo: shout: I WON'T LET YOU!
Narrator: narrator: Meanwhile, across the city...
Ghost: whisper: You cannot escape your past...
Kenji: speech: {250,150} We have to find her before it's too late!
Yumi: thought: {500,300} Should I reveal myself?
Action: speech:
```

**Invalid Examples**:

```
Kenji:speech: Text           // Missing space after first colon
Kenji: invalid: Text         // Invalid dialogue type
Kenji: speech:{250,150} Text // Missing space before position
Kenji: speech: {250} Text    // Invalid position format
: speech: Text               // Empty character name
```

## Grammar Rules

### Lexical Rules

- **Whitespace**: Spaces are significant for syntax structure; tabs are treated as single spaces
- **Newlines**: Act as statement terminators (Unix `\n`, Windows `\r\n`, or Mac `\r`)
- **Comments**: Lines starting with `//` are ignored and treated as comments
- **Case Sensitivity**: All names and identifiers are case-sensitive
- **Character Encoding**: UTF-8 encoding supported for international characters

### Hierarchical Rules

1. A script must contain at least one chapter
2. Each chapter must contain at least one scene
3. Each scene must contain at least one dialogue
4. Nesting order must be strictly: Chapter → Scene → Dialogue
5. No element can exist outside its proper hierarchy
6. Empty lines between elements are ignored

### Positioning Rules

- Coordinates are absolute within a 2000x1200 canvas coordinate system
- X-coordinate: 0 (left edge) to 2000 (right edge)
- Y-coordinate: 0 (top edge) to 1200 (bottom edge)
- Position is optional for all dialogue types
- If position is omitted, automatic placement will be used
- Coordinates outside the range will generate warnings but remain valid

## Dialogue Types

### Standard Types

- **`speech`**: Normal dialogue bubble with standard styling
- **`thought`**: Thought bubble with cloud-style appearance
- **`shout`**: Emphasized dialogue with larger, bold styling
- **`whisper`**: Quiet dialogue with smaller, subtle styling
- **`narrator`**: Narrative text box without character attribution

### Type-Specific Rendering Guidelines

- **Speech**: Standard rounded rectangle bubble with tail pointing to character
- **Thought**: Cloud-shaped bubble with small circular tail
- **Shout**: Jagged or explosive bubble outline with increased font size
- **Whisper**: Dashed or dotted border with reduced font size
- **Narrator**: Rectangular text box without tail, typically positioned at top/bottom

## Error Handling

### Syntax Errors (Critical)

- **Missing Chapter**: Script must start with a chapter declaration
- **Invalid Chapter Format**: Chapter line must start with `#` (hash + space)
- **Missing Scene**: Chapter must contain at least one scene
- **Invalid Scene Format**: Scene line must start with `*` and contain exactly one `:`
- **Missing Dialogue**: Scene must contain at least one dialogue
- **Invalid Dialogue Format**: Must follow `Character: Type: [Position] [Text]` pattern
- **Invalid Position Format**: Position must be `{integer,integer}` within braces

### Semantic Errors (Critical)

- **Invalid Dialogue Type**: Type must be one of: speech, thought, shout, whisper, narrator
- **Invalid Position Values**: Coordinates must be integers within reasonable bounds
- **Empty Required Fields**: Chapter names, scene names, and character names cannot be empty
- **Orphaned Elements**: Scenes without chapters, dialogues without scenes

### Warning Conditions (Non-Critical)

- **Overlapping Positions**: Multiple dialogues at identical coordinates
- **Off-Canvas Positions**: Coordinates outside 0-2000 x 0-1200 bounds
- **Long Text**: Dialogue text exceeding recommended character limits (100+ chars)
- **Duplicate Names**: Same character name with different casing in same scene

## Complete Example

```
# Chapter 1: The Storm Approaches

* Opening Scene: Dark clouds gather over the city as our heroes prepare for battle

Kenji: speech: {200,300} The storm is coming faster than we expected.
Yumi: thought: {500,200} I can sense something dark in those clouds.
Ryo: speech: {700,450} We need to evacuate the civilians immediately!

* The Evacuation: Chaos fills the streets as people flee from the approaching storm

Kenji: shout: {100,150} Everyone move to the shelters!
Civilian: speech: {400,300} What about the children at the school?
Yumi: speech: {600,400} I'll handle the school. You two focus on the residential area.
Action: speech:

* The Storm Hits: Lightning tears through the sky as the supernatural storm begins

Narrator: narrator: {400,50} As the first lightning bolt struck, the city knew this was no ordinary storm.
Kenji: shout: {200,500} Take cover!
Yumi: thought: {800,200} This feels... familiar. Like I've seen this before.

# Chapter 2: Revelations

* The Aftermath: The storm has passed, leaving destruction in its wake

Ryo: speech: {300,400} The damage is worse than we thought.
Kenji: speech: {500,300} But everyone is safe. That's what matters.
Yumi: whisper: {700,150} Not everyone... I can still sense something out there.

// This is a comment - ignored by the parser
* Hidden Truth: A secret about the storm's origin is revealed

Narrator: narrator: The truth they would discover would change everything.
Mysterious Voice: whisper: {400,600} The storm was only the beginning...
```

## Implementation Requirements

### Parser Specifications

- **Hierarchical Validation**: Ensure proper nesting structure throughout parsing
- **Position Validation**: Verify coordinates are integers within acceptable bounds
- **Type Validation**: Confirm dialogue types match predefined valid types
- **Error Recovery**: Provide meaningful error messages with line numbers and context
- **Comment Handling**: Properly ignore comment lines while preserving line numbers

### Data Structure Requirements

- **Chapter Context**: Each dialogue should maintain reference to its chapter
- **Scene Context**: Each dialogue should maintain reference to its scene
- **Position Handling**: Support both positioned and auto-positioned dialogues
- **Type Safety**: Ensure type validation at parse time and runtime

### Extensibility Considerations

- **New Dialogue Types**: Architecture should allow easy addition of new bubble styles
- **Enhanced Positioning**: Framework for relative positioning and anchoring
- **Scene Metadata**: Support for scene-specific properties (background, lighting, etc.)
- **Character Attributes**: Framework for character-specific styling and properties

This specification provides a comprehensive foundation for implementing the new manga script syntax while maintaining clarity, consistency, and room for future enhancements.

