- [x] ✅ **COMPLETED** AI should watch the provided YouTube video using `audio_video_tokens=True`, extract its core message, and transform it into a highly actionable, structured cohesive, concise executive summary / step-by-step tutorial, must be practical, action-oriented, and include detailed instructions for each step.
- [ ] Before responding, perform a web search to find relevant insights or highlights. Use these only when they directly enhance the response by adding clarity, depth, or useful context — omit them otherwise
- [ ] URL input dialog should persist with an progress indicator
- [ ] upon process finished, option to open button should appear
- [x] ✅ **COMPLETED** in URL input dialog box, replace dropdown list with two radio buttons labeled: "Executive", "Tutorial"



### template for output if executive selected

# Claude Code Best Practices

---

**Properties**

title: {YOUTUBE TITLE}
source: {https://www.youtube.com/watch?v=gv0WHhKelSE}
created: "2025-09-10"
description: "Single sentence capturing the core insight"
tags: #tag_1 #tag_2 #tag_3 <no more than 3> 
status: <leave empty>

----

[[embed original youtube video]]

---

## Executive Summary:

**Key Takeaways**

- takeaway-1
- takeaway-2
- takeaway-3

### Concise Summary  

summarize with key takeaways 3-4 bulleted followed by a coherent concise summary with two paragraphs <150 words each

------

### template for output if Tutorial selected

# Claude Code Best Practices

---

**Properties**

title: {YOUTUBE TITLE}
source: {https://www.youtube.com/watch?v=gv0WHhKelSE}
created: "2025-09-10"
description: "Single sentence capturing the core insight"
tags: #tag_1 #tag_2 #tag_3 <no more than 3> 
status: <leave empty>

----

[[embed original youtube video]]

----

## Comprehensive Tutorial

### Concise Summary

must be a two-part response: a concise summary and a detailed step-by-step guide. The summary must be under 150 words and capture the video's core value

### Step-by-Step Guide

The step-by-step guide must be practical, action-oriented, and include detailed instructions for each step. 

