import type { BlogPost } from './types';

export const article15: BlogPost = {
  "number": 15,
  "slug": "what-are-foundation-models",
  "title": "What Are Foundation Models?",
  "seoTitle": "What Are Foundation Models? Architecture, Modalities, Risks & Governance — Vizra Blog",
  "description": "A research-driven guide to foundation models: how Stanford CRFM defined the paradigm, how pretraining and adaptation work across text, vision, biology, and weather, and what systemic risks and regulations shape their future.",
  "excerpt": "For decades, building a machine learning system meant training a narrow specialist from scratch for every task. Foundation models inverted that equation—replacing bespoke pipelines with massive, self-supervised base models adapted to language, vision, robotics, weather forecasting, and molecular biology. Here is how the paradigm works, where it breaks, and how regulators are trying to govern it.",
  "publishedAt": "2026-11-26",
  "updatedAt": "2026-11-23",
  "category": "Machine Learning & Advanced AI",
  "series": "Batch 2 · Machine Learning & Advanced AI",
  "author": "VIZRA Editorial Research",
  "authorRole": "AI Engineering & Technical Editorial Desk",
  "readTimeMinutes": 22,
  "primaryKeyword": "foundation models",
  "secondaryKeywords": [
    "Stanford CRFM foundation models",
    "emergence and homogenization AI",
    "pretraining and adaptation",
    "multimodal foundation models",
    "open-weight vs proprietary AI models",
    "LoRA and RAG adaptation",
    "EU AI Act GPAI"
  ],
  "featuredImage": "/images/blog/what-are-foundation-models.jpg",
  "featuredImageAlt": "Editorial architectural illustration showing a luminous crystalline base structure radiating distinct data streams into text, satellite imagery, folded protein structures, weather systems, and robotic arms on a deep slate background.",
  "featuredImageCaption": "A unified crystalline foundation model radiating shared representations across language, structural biology, climate dynamics, Earth observation, and robotics.",
  "keyTakeaways": [
    "Foundation models—coined by Stanford CRFM in 2021—replace siloed task-specific pipelines with broad self-supervised pretraining on web-scale multimodal data, enabling flexible adaptation across hundreds of downstream tasks.",
    "Homogenization creates extraordinary engineering leverage across language, vision, biology (AlphaFold 3), weather (GenCast), and robotics, while simultaneously concentrating systemic risk whenever upstream flaws propagate downstream.",
    "Production teams rarely retrain foundation models from scratch; instead, they layer prompting, retrieval-augmented generation (RAG), parameter-efficient fine-tuning (LoRA/QLoRA), and knowledge distillation to balance freshness, control, and cost.",
    "As frontier compute grows $4\\times$–$5\\times$ annually past the EU AI Act's $10^{25}$ FLOPs systemic-risk threshold, Stanford's Foundation Model Transparency Index highlights a widening gap between model scale and public disclosure."
  ],
  "sections": [
    {
      "id": "introduction-the-quiet-inversion-of-machine-learning",
      "heading": "Introduction: The Quiet Inversion of Machine Learning",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "For the better part of thirty years, machine learning operated like a guild of hyper-specialized artisans. If a hospital needed software to flag tumors on chest radiographs, engineers assembled tens of thousands of hand-labeled X-rays and trained a convolutional neural network from scratch. If a bank wanted to classify customer support tickets, a separate team curated labeled transcripts and trained a completely different model. Neither system knew anything about the other's domain, and neither could step outside the narrow perimeter of its training labels without collapsing."
        },
        {
          "type": "paragraph",
          "text": "Between 2018 and 2021, that one-task, one-model workflow began to dissolve. Researchers discovered that a single neural network trained on vast, largely unlabeled corpora—internet text, paired images and captions, raw audio, or decades of atmospheric measurements—could serve as a reusable substrate for dozens or hundreds of downstream applications. In August 2021, an interdisciplinary team of more than one hundred researchers at Stanford University's newly formed Center for Research on Foundation Models (CRFM) gave this shift a name. In their landmark 214-page monograph, *On the Opportunities and Risks of Foundation Models*, Rishi Bommasani, Percy Liang, and their collaborators defined a foundation model as \"any model that is trained on broad data (generally using self-supervision at scale) that can be adapted (e.g., fine-tuned) to a wide range of downstream tasks\" [1]."
        },
        {
          "type": "paragraph",
          "text": "The choice of the word *foundation* was deliberate, and it carried a subtle warning that is often lost in popular coverage. As the Stanford authors wrote, they coined the term \"to underscore their critically central yet incomplete character\" [1]. A foundation is not a finished building. It"
        },
        {
          "type": "paragraph",
          "text": "bears the structural load of everything constructed atop it, which grants enormous engineering leverage—and means that any crack in the concrete propagates upward into every room. Five years after that report appeared, foundation models have expanded far beyond chatbots and text completion. They now segment satellite imagery from low Earth orbit [12], predict the three-dimensional interactions of proteins, DNA, and small-molecule drugs [9], generate ten-day global weather forecasts in under a minute [10], and translate natural-language commands directly into robotic arm movements [8]. Understanding what foundation models actually are—"
        },
        {
          "type": "paragraph",
          "text": "technically, economically, and socially—has become essential to understanding modern computing."
        }
      ]
    },
    {
      "id": "historical-background-from-bespoke-features-to-pretraining-at-sc",
      "heading": "Historical Background: From Bespoke Features to Pretraining at Scale",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Foundation models did not appear out of thin air; they represent the third major wave of consolidation in modern machine learning [1]. In classical machine learning during the 1990s"
        },
        {
          "type": "paragraph",
          "text": "and 2000s, human domain experts manually engineered numerical features—edge detectors in computer vision, syntactic n-grams in language processing—and fed them into algorithms such as support vector machines or decision trees. Every new problem demanded new feature engineering."
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/03-lora-low-rank-decomposition.svg",
          "alt": "Neural block schematic illustrating frozen pre-trained weight matrix W0 in parallel with trainable low-rank adaptation matrices A and B (rank r << d) reducing trainable parameters by over 99%.",
          "caption": "Fig. 15.3 — Inside Low-Rank Adaptation (LoRA): freezing dense base weights while injecting compact trainable rank-r update matrices.",
          "width": 1200,
          "height": 675
        },
        {
          "type": "paragraph",
          "text": "The deep learning revolution of the early 2010s, catalyzed by AlexNet's breakthrough on the ImageNet benchmark in 2012, eliminated much of that manual feature design [1]. Deep neural"
        },
        {
          "type": "paragraph",
          "text": "networks learned hierarchical representations directly from raw inputs such as pixels or acoustic waveforms. Engineers began practicing *transfer learning*—taking a convolutional network pretrained on ImageNet's 1.28 million labeled photographs and fine-tuning its final layers for medical imaging or wildlife identification. Even so, architecture and training pipelines remained fragmented across fields, and high-performing systems still leaned heavily on expensive human-annotated datasets."
        },
        {
          "type": "paragraph",
          "text": "The decisive inflection point arrived in natural language processing (NLP) in late 2018. Building on the Transformer architecture introduced in 2017—which replaced sequential recurrence with parallelizable self-attention mechanisms—researchers realized they could dispense with human labels altogether during pretraining. Instead, a model could learn by playing a massive fill-in-the-blank or next-word prediction game on raw web text, a paradigm known as *self-supervised learning*."
        },
        {
          "type": "paragraph",
          "text": "In October 2018, Jacob Devlin and colleagues at Google AI Language introduced BERT (Bidirectional Encoder Representations from Transformers) [2]. By masking random words in"
        },
        {
          "type": "paragraph",
          "text": "sentences and training a deep bidirectional Transformer to reconstruct them from both left and right context, BERT produced general-purpose language representations that could be fine-tuned with just a single additional output layer. It immediately set new state-of-the-art marks across eleven NLP benchmarks, pushing the GLUE score to 80.5% (a 7.7 percentage-point absolute jump) and SQuAD v1.1 question-answering F1 to 93.2 [2]. Almost overnight, bespoke"
        },
        {
          "type": "paragraph",
          "text": "task-specific NLP architectures became obsolete."
        },
        {
          "type": "paragraph",
          "text": "Two years later, in May 2020, Tom Brown and colleagues at OpenAI demonstrated what happened when that pretraining recipe was scaled by nearly three orders of magnitude. Their autoregressive model, GPT-3, contained 175 billio*n* parameters—up from roughly 110 million to 340 million in BERT [3]. Crucially, GPT-3 did not even require gradient updates to tackle unfamiliar tasks. Through in-context learning, a user could supply a plain-English instruction and a handful of examples directly inside the prompt, and the frozen model would infer the task on the fly [3]. When Bommasani and the Stanford CRFM team surveyed BERT, GPT-3, and"
        },
        {
          "type": "paragraph",
          "text": "early image-generation systems like DALL-E in August 2021, they recognized that scale plus transfer learning had crossed a qualitative threshold [1]. Machine learning had entered the era"
        },
        {
          "type": "paragraph",
          "text": "of foundation models."
        }
      ]
    },
    {
      "id": "the-central-concept-emergence-and-homogenization",
      "heading": "The Central Concept: Emergence and Homogenization",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "What separates a foundation model from an ordinary pretrained neural network? Technically, both rely on deep learning, gradient-based optimization, and transfer learning. According to the Stanford CRFM framework, the distinction rests on two interlocking system-level properties: emergence and homogenization [1]."
        }
      ]
    },
    {
      "id": "emergence-and-the-debate-over-predictable-scaling",
      "heading": "Emergence and the Debate Over Predictable Scaling",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Emergence means that the behavior of a system is implicitly induced rather than explicitly constructed [1]. Nobody hard-coded a French-to-English translator or a Python debugger into GPT-3; those capabilities arose as byproducts of predicting the next token across hundreds of billions of words of text. In June 2022, Jason Wei and colleagues formalized emergent abilities as capabilities that are \"not present in smaller models but [are] present in larger models,\" meaning they cannot be easily predicted by linearly extrapolating the accuracy of smaller prototypes [13]. Examples documented in the literature included multi-step arithmetic, chain-"
        },
        {
          "type": "paragraph",
          "text": "of-thought reasoning, and solving intricate word puzzles once parameter counts or training compute crossed certain thresholds."
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/05-enterprise-rag-foundation-stack.svg",
          "alt": "Production enterprise architecture diagram tracing user query embedding, vector knowledge retrieval, grounded prompt assembly, foundation model synthesis, and citation verification guardrails.",
          "caption": "Fig. 15.5 — Production enterprise foundation stack layering vector RAG retrieval, citation grounding, and policy guardrails around a base model.",
          "width": 1200,
          "height": 675
        },
        {
          "type": "paragraph",
          "text": "Yet emergence quickly became one of the most fiercely debated concepts in AI science. In April 2023, Stanford researchers Rylan Schaeffer, Brando Miranda, and Sanmi Koyejo published a provocative paper titled *Are* *Emergent Abilities of Large Language Models a Mirage?* [14]. They demonstrated that many apparent phase transitions were artifacts of"
        },
        {
          "type": "paragraph",
          "text": "discontinuous evaluation metrics—such as exact-match accuracy or multiple-choice grading, which award zero credit until a model gets every intermediate step right. When they re-evaluated the same models using continuous metrics like token-level cross-entropy loss or edit distance, performance improved smoothly and predictably with scale [14]. OpenAI's March"
        },
        {
          "type": "paragraph",
          "text": "2023 *GPT-4 Technical Report* reinforced that engineering reality from a different angle: by building a predictable deep learning stack, engineers accurately forecast aspects of GPT-4's final loss and coding performance from smaller proxy models trained with 1,000 to 10,000 times less compute [4]."
        },
        {
          "type": "paragraph",
          "text": "Both perspectives hold truth. Underlying statistical loss may follow smooth power laws, yet at the level of real-world utility—whether a model can reliably parse a legal contract, write compiling software, or pass a simulated bar exam in the top 10% of test takers, as GPT-4 did [4]—crossing a competence threshold still feels abrupt to deployers and remains difficult to"
        },
        {
          "type": "paragraph",
          "text": "anticipate across every possible downstream use case."
        }
      ]
    },
    {
      "id": "homogenization-leverage-and-systemic-fragility",
      "heading": "Homogenization: Leverage and Systemic Fragility",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "If emergence is the engine of capability, *homogenization* is the engine of consolidation. Homogenization refers to the convergence of methodologies across applications, domains, and industries onto a tiny handful of shared base models [1]. Where an enterprise once"
        },
        {
          "type": "paragraph",
          "text": "maintained twenty distinct machine learning pipelines—one for search ranking, one for document extraction, one for sentiment analysis, one for code completion—it can now route all twenty workflows through a single foundation model or model family."
        },
        {
          "type": "paragraph",
          "text": "That consolidation delivers extraordinary economic leverage. An improvement in the base model's reasoning, multilingual fluency, or factual calibration cascades simultaneously to every downstream application built on top of it. The exact same geometry, however, turns the foundation model into a single point of failure. As Bommasani et al. cautioned, \"the defects of the foundation model are inherited by all the adapted models downstream\" [1]. A subtle demographic bias, a security vulnerability to prompt injection, or a recurring hallucination pattern in one widely deployed base model is no longer an isolated bug; it becomes an industry-wide systemic risk."
        }
      ]
    },
    {
      "id": "technical-foundations-how-foundation-models-are-built",
      "heading": "Technical Foundations: How Foundation Models Are Built",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Constructing a frontier foundation model is as much an exercise in distributed systems engineering and data curation as it is in neural network design. Although implementations vary across modalities, the lifecycle typically unfolds across three major phases: architecture and tokenization, large-scale self-supervised pretraining, and post-training alignment."
        }
      ]
    },
    {
      "id": "tokenization-and-architectural-backbones",
      "heading": "Tokenization and Architectural Backbones",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Before a neural network can process raw reality, that reality must be translated into discrete or continuous mathematical tokens. For text models, subword tokenizers split sentences into frequent word pieces so the model can handle rare vocabulary, code syntax, and dozens of human languages without exploding its vocabulary table. For vision and multimodal models, images are sliced into two-dimensional grids of pixel patches (as in Vision Transformers), video into three-dimensional spatiotemporal patches [12], and audio into spectrogram frames."
        },
        {
          "type": "paragraph",
          "text": "Across almost all modern foundation models, the dominant computational backbone is the Transformer (or a hybrid combining Transformers with graph neural networks, diffusion modules, or state-space layers). Inside a Transformer, *self-attention* allows every token in a sequence to weigh its mathematical relationship with every other token, capturing long-range dependencies across thousands—or even millions—of tokens. To manage inference costs at massive scale, many modern architectures replace dense feedforward layers with a *Sparse* *Mixture of Experts (SMoE)*. Instead of activating every weight for every token, a lightweight router network directs each token to only a small subset of specialized sub-networks. Mistral AI's Mixtral 8×7B, released in January 2024 under the Apache 2.0 license, illustrates the payoff: each layer holds eight expert blocks totaling 47 billion parameters, yet only two experts —roughly 13 billion active parameters—fire for any given token, matching or outperforming dense 70-billion-parameter peers at a fraction of the inference compute [19]."
        }
      ]
    },
    {
      "id": "self-supervised-pretraining-and-compute-scale",
      "heading": "Self-Supervised Pretraining and Compute Scale",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "During pretraining, the model ingests trillions of tokens—web pages, books, scientific papers, source code, images, audio, and video—using a self-supervised objective that requires no manual labeling. Autoregressive models predict the next token given all preceding tokens; masked autoencoders (used in BERT and geospatial models like NASA-IBM Prithvi) hide portions of the input and learn to reconstruct them [2], [12]; contrastive models (such as CLIP)"
        },
        {
          "type": "paragraph",
          "text": "learn to pull matching image-caption pairs together in a shared embedding space while pushing mismatched pairs apart [5]."
        },
        {
          "type": "paragraph",
          "text": "The computational appetite of this stage is staggering. According to Epoch AI's longitudinal tracking, training compute for frontier language models has grown by roughly 4x to 5x per year since 2020 [26]. By early 2025, more than 30 AI models had been trained using over $10^{25}$ floating-point operations (FLOPs) [26]. Meta's Llama 3.1 405B flagship, detailed in The Llama 3 *Herd of Models* (July 2024), required sprawling clusters of tens of thousands of GPUs, custom reliability engineering to handle hardware faults mid-run, and multi-stage pretraining that expanded its context window and annealed its learning rate on high-quality data [22]. Google's Gemini 1.5 Pro was similarly trained across multiple 4,096-chip pods of TPUv4 accelerators distributed across datacenters [20]."
        }
      ]
    },
    {
      "id": "post-training-turning-a-predictor-into-an-assistant",
      "heading": "Post-Training: Turning a Predictor into an Assistant",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "A freshly pretrained foundation model is a raw statistical mirror of its training corpus. Ask it a question, and it may simply generate five more similar questions rather than an answer. Turning that base model into a reliable, steerable tool requires *post-training*. The landmark demonstration of this step came in March 2022 with OpenAI's InstructGPT paper by Long Ouyang and colleagues [15]. The researchers first applied supervised fine-tuning"
        },
        {
          "type": "paragraph",
          "text": "(SFT) on human-written demonstrations of helpful responses, then trained a reward model on human preference rankings, and finally optimized the language model against that reward model using R*einforcement Learning from* *Human Feedback* (RLHF) [15]. The result upended"
        },
        {
          "type": "paragraph",
          "text": "pure parameter-counting assumptions: human evaluators preferred outputs from the 1.3-billion-parameter InstructGPT model over the 175-billion-parameter base GPT-3, despite InstructGPT having more than 100 times fewer parameters [15]. Subsequent pipelines—"
        },
        {
          "type": "paragraph",
          "text": "including Meta's Llama 3 post-training—also adopted *Direct Preference Optimization* (DPO), which optimizes directly on preference pairs without maintaining a separate reward network [22]."
        },
        {
          "type": "paragraph",
          "text": "More recently, post-training has evolved into a dedicated engine for explicit reasoning. In January 2025, DeepSeek-AI published *DeepSeek-R1*, demonstrating that large-scale reinforcement learning with verifiable rewards (such as mathematical correctness and code unit tests) can incentivize models to generate extended internal chains of thought, self-verify their steps, and backtrack when an approach fails [23]."
        }
      ]
    },
    {
      "id": "how-foundation-models-adapt-to-downstream-tasks",
      "heading": "How Foundation Models Adapt to Downstream Tasks",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Because pretraining a frontier model costs tens of millions of dollars [26], almost no organization trains one from scratch. Instead, the practical craft of working with foundation models lies in adaptation —steering a general-purpose base model toward a specific domain, style, or factual corpus. Five core adaptation mechanisms anchor modern AI engineering, each occupying a distinct point on the trade-off curve between cost, latency, factual freshness, and behavioral control."
        },
        {
          "type": "table",
          "headers": [
            "Adaptation Mechanism",
            "Modifies Model Weights?",
            "Primary Strength",
            "Key Limitations",
            "Representative Origin /Milestone"
          ],
          "rows": [
            [
              "Zero-Shot / Few-Shot Prompting",
              "No",
              "Instant deployment; zero training infrastructure; flexible across tasks",
              "Bounded by context window; sensitive to phrasing; higher per-query token cost for long examples",
              "Brown et al., GPT-3 (2020)[3]"
            ],
            [
              "Retrieval- Augmented Generation (RAG)",
              "No (base model frozen; external index updated)",
              "Grounds outputs in live, proprietary, or verifiable documents; reduces stale-knowledge errors; supports citations",
              "Quality depends on retriever recall and chunking; adds retrieval latency",
              "Lewis et al., NeurIPS (2020)[17]"
            ],
            [
              "Parameter- Efficient Fine-Tuning (LoRA / PEFT)",
              "Partially (trains small low-rank adapter matrices)",
              "Cuts trainable parameters and GPU memory drastically; allows hot-swapping task adapters with zero added inference latency",
              "Requires curated labeled examples; less effective than RAG for rapidly changing facts",
              "Hu et al., Microsoft[16] (2021)"
            ],
            [
              "Full Fine- Tuning",
              "Yes (all parameters updated)",
              "Maximum behavioral adaptation for specialized domains, formats, or modalities",
              "High compute and storage cost; risk of catastrophic forgetting of general capabilities",
              "Devlin et al., BERT (2018) [2]"
            ],
            [
              "Knowledge Distillation",
              "Yes (trains a smaller student network)",
              "Compresses frontier reasoning or accuracy into fast, low-cost models suitable for edge or high-volume serving",
              "Student capacity ceiling; licensing restrictions on distilling proprietary teacher outputs",
              "Hinton, Vinyals, & Dean (2015)[18]"
            ]
          ]
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/02-adaptation-decision-matrix.svg",
          "alt": "Engineering decision matrix comparing Prompting, Retrieval-Augmented Generation (RAG), LoRA/PEFT, Full Fine-Tuning, and Knowledge Distillation across cost, weight mutability, control, and data freshness.",
          "caption": "Fig. 15.2 — Foundation model adaptation decision matrix weighing compute cost, behavioral control, and real-time knowledge freshness.",
          "width": 1200,
          "height": 675
        },
        {
          "type": "paragraph",
          "text": "In production systems, these methods are rarely mutually exclusive; they are layered. Prompting handles rapid prototyping and task framing. When a model must reason over proprietary policies, legal filings, or breaking news that did not exist at pretraining time, engineers pair it with R etrieval-Augmented Generation (RAG). Introduced by Patrick Lewis and colleagues in May 2020, RAG couples a model's parametric memory (its frozen neural weights) with a non-parametric external memory—typically a dense vector index of documents [17]. At query time, a neural retriever fetches the most relevant passages and injects them into the model's context, yielding more factual, verifiable answers without retraining the weights [17]."
        },
        {
          "type": "paragraph",
          "text": "When the challenge is *how* the model behaves—adhering to a strict clinical schema, mastering a niche programming language, or speaking in a specialized diagnostic register—teams turn to Parameter-Efficient Fine-Tuning (PEFT). The workhorse of this category is LoRA (Low-Rank Adaptation), introduced by Edward Hu and colleagues at Microsoft in June 2021 [16]. Rather"
        },
        {
          "type": "paragraph",
          "text": "than updating billions of pretrained weights, LoRA freezes the original weight matrices and injects tiny, trainable pairs of low-rank decomposition matrices in parallel [16]. Because the"
        },
        {
          "type": "paragraph",
          "text": "learned updates can be mathematically merged back into the base weights before deployment, LoRA slashes memory requirements during training while introducing zero extra inference latency."
        },
        {
          "type": "paragraph",
          "text": "Finally, knowledge distillation —originally formulated by Geoffrey Hinton, Oriol Vinyals, and Jeff Dean in 2015 [18]—has become indispensable for economics. Organizations use a"
        },
        {
          "type": "paragraph",
          "text": "massive frontier \"teacher\" model to generate high-quality synthetic trajectories or probability distributions, then train a much smaller \"student\" model to mimic them. DeepSeek-R1 demonstrated the potency of this approach in early 2025 by distilling its large reasoning model's outputs into compact open-weight models ranging from 1.5 billion to 70 billion parameters, dramatically expanding access to strong reasoning on modest hardware [23]."
        }
      ]
    },
    {
      "id": "beyond-text-foundation-models-across-modalities-and-sciences",
      "heading": "Beyond Text: Foundation Models Across Modalities and Sciences",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Because chatbots captured public imagination first, \"foundation model\" is frequently conflated with \"large language model\" (LLM). That shorthand obscures the true breadth of the paradigm. Wherever massive, structured or semi-structured datasets exist—pixels, sound waves, molecular coordinates, atmospheric grids, or robot trajectories—foundation models have taken root."
        }
      ]
    },
    {
      "id": "vision-audio-and-native-multimodality",
      "heading": "Vision, Audio, and Native Multimodality",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Computer vision underwent its own foundation-model pivot in February 2021 when Alec Radford and colleagues at OpenAI unveiled CLIP (Contrastive Language-Image Pre-training) [5]. Trained on 400 million image-text pairs scraped from the internet, CLIP learned to align"
        },
        {
          "type": "paragraph",
          "text": "visual and linguistic concepts in a single vector space. Without seeing a single labeled ImageNet training example, CLIP matched the accuracy of a fully supervised ResNet-50 on ImageNet zero-shot—breaking computer vision out of closed, fixed-category label lists [5]."
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/04-multimodal-foundation-ecosystem.svg",
          "alt": "Unified ecosystem map connecting core foundation architectures to six production modalities: language and code, vision and video, audio, biomolecular structures (AlphaFold 3), climate (GenCast), and robotics.",
          "caption": "Fig. 15.4 — Cross-domain foundation model landscape spanning language, visual media, structural biology, atmospheric physics, and embodied control.",
          "width": 1200,
          "height": 675
        },
        {
          "type": "paragraph",
          "text": "Two years later, in April 2023, Alexander Kirillov and colleagues at Meta AI pushed visual foundation models into pixel-level perception with the Segment Anything Model (SAM) [6]."
        },
        {
          "type": "paragraph",
          "text": "Using a human-and-model-in-the-loop data engine, they built the SA-1B dataset containing more than 1 billion segmentation masks across 11 million licensed images [6]. SAM turned"
        },
        {
          "type": "paragraph",
          "text": "image segmentation into a promptable zero-shot capability: point to an object with a click, a bounding box, or a rough mask, and the model isolates its exact boundary even in unfamiliar domains such as underwater photography or microscopy. Meta subsequently extended this promptable segmentation paradigm to video with SAM 2 in August 2024. In audio, OpenAI's Whisper (December 2022) demonstrated that large-scale weak supervision —680,000 hours of multilingual, multitask audio collected from the web—could produce a single speech recognition model robust to accents, background noise, and technical jargon across nearly 100 languages without dataset-specific fine-tuning [7]."
        },
        {
          "type": "paragraph",
          "text": "The next evolutionary leap fused these separate sensory silos into *natively multimodal* foundation models. Rather than bolting a separate image captioner onto a text model, systems like GPT-4 [4], Anthropic's Claude 3 and Claude 3.5 Sonnet (June 2024) [21], and Google DeepMin*d'***s G emini family ingest interleaved streams of text, code, images, audio, and video withi n a unifi ed architecture. In its Ma*rch 2024* technical report, Gemini 1.5 Pro demonstrated stable long-context recall up to 10 million tokens—equivalent to roughly 107 hours of audio, 10.5 hours of video at one frame per second, or more than ten times the length of War and Peace [20]."
        }
      ]
    },
    {
      "id": "embodied-ai-and-robotics",
      "heading": "Embodied AI and Robotics",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Bringing foundation models into the physical world requires bridging perception, language, and motor control. In July 2023, Anthony Brohan and colleagues at Google DeepMind introduced RT-2 (Robotic Transformer 2), pioneering the category of Vision-Language-Action (VLA) models [8]. By representing robot motor actions as discrete text-like tokens and co-fine-tuning"
        },
        {
          "type": "paragraph",
          "text": "web-scale vision-language models (up to 55 billion parameters) on both internet data and robotic trajectories, RT-2 transferred semantic knowledge directly to physical manipulation [8]. Across 6,000 real-world robotic evaluation trials, RT-2 generalized to novel objects and commands never seen in robot training—for instance, picking up a rock when asked for an improvised hammer, or selecting an energy drink for a person who is tired [8]."
        }
      ]
    },
    {
      "id": "scientific-foundation-models-biology-weather-and-earth-observati",
      "heading": "Scientific Foundation Models: Biology, Weather, and Earth Observation",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Perhaps the most consequential applications of foundation models lie outside consumer software entirely, in the natural sciences."
        },
        {
          "type": "paragraph",
          "text": "In structural biology, Google DeepMind and Isomorphic Labs published AlphaFold 3 in Nature in May 2024 [9]. Moving beyond single-protein folding, AlphaFold 3 uses a diffusion-based"
        },
        {
          "type": "paragraph",
          "text": "architecture to jointly predict the three-dimensional structures and interactions of proteins, DNA, RNA, ions, and small-molecule ligands—effectively modeling the molecular machinery of life within one unified framework [9]. Following community calls for open scientific verification, its developers released AlphaFold 3's model code and weights for academic use in November 2024 [9]. Alongside structural models, biological sequence foundation models—such as Meta's ESM-2 for proteins and genomic models like Evo-1 and Evo-2—treat amino acids and nucleotides as tokens to learn evolutionary constraints across millions of sequences."
        },
        {
          "type": "paragraph",
          "text": "In atmospheric physics, foundation models have challenged half a century of supercomputer-bound numerical weather prediction (NWP). NVIDIA and Lawrence Berkeley National Laboratory's FourCastNet (February 2022) used Adaptive Fourier Neural Operators to generate high-resolution global forecasts orders of magnitude faster than physics-based differential equation solvers [11]. In November 2023, Remi Lam and colleagues at Google DeepMind published GraphCast in Science [10]. Trained on decades of historical atmospheric reanalysis data, GraphCast produces 10-day global weather forecasts at 0.25° latitude-longitude resolution (roughly 28 km at the equator) in under one minute on a single accelerator, significantly outperforming the European Centre for Medium-Range Weather Forecasts' (ECMWF) flagship deterministic system on 90% of 1,380 verification targets — including tropical cyclone tracking and extreme temperature events [10]. Earth observation has followed suit. Beginning in August 2023, NASA and IBM openly released Prithvi, a temporal Vision Transformer pretrained on NASA's Harmonized Landsat and Sentinel-2 (HLS) satellite archive [12]. Upgraded to Prithvi-EO-2.0 (300M and 600M parameters) in December 2024 in collaboration with the Jülich Supercomputing Centre, the model can be fine-tuned with small labeled datasets to map flood plains, monitor wildfire burn scars, and classify agricultural crops [12]."
        },
        {
          "type": "table",
          "headers": [
            "Model / Family",
            "Primary Modality & Domain",
            "Release Date",
            "Notable Scale / Technical Detail",
            "Access Model"
          ],
          "rows": [
            [
              "BERT [2]",
              "Text (NLP)",
              "Oct 2018",
              "Bidirectional masked Transformer; SOTA across 11 NLP tasks",
              "Open weights"
            ],
            [
              "[3]GPT-3",
              "Text (NLP)",
              "May 2020",
              "175B parameters; demonstrated zero-/few-shot in-context learning",
              "Proprietary API"
            ],
            [
              "CLIP [5]",
              "Vision + Language",
              "Feb 2021",
              "400M image-text pairs; zero-shot ImageNet parity with ResNet-50",
              "Open weights"
            ],
            [
              "FourCastNet[11]",
              "Global Weather",
              "Feb 2022",
              "Adaptive Fourier Neural Operator; high-resolution data-driven forecasting",
              "Open weights / code"
            ],
            [
              "Whisper [7]",
              "Audio / Speech",
              "Dec 2022",
              "680,000 hours of weak multilingual supervision across ~100 languages",
              "Open weights"
            ],
            [
              "[4]GPT-4",
              "Multimodal (Text + Image)",
              "Mar 2023",
              "Top 10% simulated bar exam; predictable scaling across 1,000x–10,000x compute",
              "Proprietary API"
            ],
            [
              "SAM [6]",
              "Computer Vision",
              "Apr 2023",
              "Trained on SA-1B (>1B masks, 11M images); promptable zero-shot segmentation",
              "Open weights"
            ],
            [
              "RT-2 [8]",
              "Vision-Language- Action (Robotics)",
              "Jul 2023",
              "Up to 55B parameters; 6,000 real-world robotic trials",
              "Proprietary research"
            ],
            [
              "GraphCast[10]",
              "Global Weather",
              "Nov 2023",
              "10-day 0.25° forecast in <1 min; beats deterministic baseline on 90% of 1,380 targets",
              "Open weights / code"
            ],
            [
              "[19]Mixtral 8×7B",
              "Text / Code",
              "Jan 2024",
              "Sparse MoE: 47B total, 13B active parameters; Apache 2.0",
              "Open weights"
            ],
            [
              "Gemini 1.5 Pro[20]",
              "Native Multimodal",
              "Mar 2024",
              "Up to 10M-token context (107 h audio or 10.5 h video)",
              "Proprietary API"
            ],
            [
              "AlphaFold 3[9]",
              "Structural Biology",
              "May 2024",
              "Diffusion architecture predicting protein, DNA, RNA, and ligand complexes",
              "Academic weights (Nov 2024)"
            ],
            [
              "Claude 3.5 Sonnet [21]",
              "Multimodal (Text + Vision)",
              "Jun 2024",
              "200k-token context; strong coding and agentic benchmarks",
              "Proprietary API"
            ],
            [
              "Llama 3.1 (405B) [22]",
              "Text /Multilingual /Tool Use",
              "Jul 2024",
              "Dense 405B flagship plus 8B and 70B variants; custom Llama license",
              "Open weights"
            ],
            [
              "DeepSeek-R1[23]",
              "Reasoning / Text / Code",
              "Jan 2025",
              "Large-scale RL-trained reasoning model with distilled open variants",
              "Open weights (MIT)"
            ]
          ]
        }
      ]
    },
    {
      "id": "open-weight-vs-proprietary-ecosystems",
      "heading": "Open-Weight vs. Proprietary Ecosystems",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "The economics and governance of foundation models have bifurcated into two competing distribution models: proprietary API-gated models and open-weight models. The terminology matters. Very few frontier models are truly \"open source\" in the strict software sense—which would require releasing raw pretraining datasets, filtering code, and full training recipes alongside permissive licenses. Most publicly downloadable foundation models are more accurately described as *open-weight*: developers publish the trained neural parameters so anyone can inspect, fine-tune, quantize, or host them on private infrastructure."
        },
        {
          "type": "paragraph",
          "text": "Proprietary leaders—OpenAI (GPT series), Anthropic (Claude series), and Google DeepMind (Gemini series)— keep weights behind cloud APIs. This model funds massive capital expenditures in compute clusters, allows continuous post-deployment safety monitoring, and shields intellectual property, while relieving enterprise buyers of GPU cluster management. Its downsides are vendor lock-in, opaque data provenance, unpredictable pricing or model deprecations, and strict data-residency hurdles for regulated industries."
        },
        {
          "type": "paragraph",
          "text": "Open-weight ecosystems—anchored by Meta's Llama herd [22], Mistral AI's Apache-licensed models [19], DeepSeek's MIT-licensed reasoning releases [23], and scientific releases like NASA-IBM Prithvi [12]—offer the mirror image. Organizations retain full control over weights, run inference behind air-gapped firewalls, fine-tune deeply with LoRA or full parameter updates, and avoid per-token vendor dependencies."
        },
        {
          "type": "paragraph",
          "text": "For several years, choosing open weights meant accepting a steep capability penalty. That gap has compressed dramatically. According to the Stanford HAI 2025 *AI Index Report*, the benchmark performance gap between leading open-weight and closed-weight models narrowed from 8% to just 1.7% on several major evaluations within a single year [28]. Meanwhile, inference costs for GPT-3.5-level performance plunged more than 280-fold between November 2022 and October 2024, propelled by smaller, better-trained models, quantization, and hardware efficiency gains [28]. Yet open weights carry their own trade-offs:"
        },
        {
          "type": "paragraph",
          "text": "once weights are public, safety guardrails can be stripped via fine-tuning, and enterprises must shoulder the full operational burden of hosting, securing, and auditing the stack themselves."
        }
      ]
    },
    {
      "id": "real-world-applications-and-industry-case-studies",
      "heading": "Real-World Applications and Industry Case Studies",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Moving from benchmark leaderboards to production workflows reveals where foundation models deliver verified value—and where careful systems engineering makes the difference between a demo and a dependable tool."
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/01-siloed-vs-foundation-paradigm.svg",
          "alt": "Two-panel architectural comparison between legacy siloed task-specific ML pipelines and the foundation model hub-and-spoke pretraining and adaptation paradigm.",
          "caption": "Fig. 15.1 — Paradigm shift from isolated task-specific models to unified foundation model pretraining with multi-task adaptation.",
          "width": 1200,
          "height": 675
        }
      ]
    },
    {
      "id": "software-engineering-github-copilot-and-code-assistants",
      "heading": "Software Engineering: GitHub Copilot and Code Assistants",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Software development became the earliest mass-market proving ground for code-capable foundation models because code has formal syntax, deterministic compilers, and automated test suites. In a controlled randomized trial published in February 2023 by Sida Peng and colleagues across Microsoft Research, GitHub, and MIT, software engineers tasked with implementing an HTTP server in JavaScript completed the assignment 55.8% faster when assisted by GitHub Copilot than peers in the control group [24]. Subsequent real-world engineering studies have added crucial nuance: while AI assistants consistently accelerate boilerplate generation and task completion, empirical studies also highlight risks of reduced code comprehension among junior developers and subtle security or stability regressions if organizations relax human code review [24]."
        }
      ]
    },
    {
      "id": "financial-services-ai-morgan-stanley-assistant",
      "heading": "Financial Services: AI @ Morgan Stanley Assistant",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Regulated financial institutions cannot afford ungrounded hallucinations. In September 2023, Morgan Stanley rolled out the AI @ Morgan Stanley Assistant, built on OpenAI's GPT-4, to its wealth management division of more than 16,000 financial advisors and support personnel [25]. Rather than asking GPT-4 to dispense open-ended investment advice from its pretrained"
        },
        {
          "type": "paragraph",
          "text": "memory, Morgan Stanley architected a strict retrieval-augmented pipeline restricted to roughly 100,000 vetted internal research reports and firm documents [25]. The firm paired the rollout with systematic domain-specific evaluations (evals) crafted alongside internal wealth-management experts to verify factual grounding before expanding into meeting-summary tools like Debrief [25]. The deployment became a template for enterprise AI: combine a frontier"
        },
        {
          "type": "paragraph",
          "text": "model's language synthesis with closed-book RAG and rigorous human-in-the-loop governance."
        }
      ]
    },
    {
      "id": "earth-science-and-orbital-computing-nasa-ibm-prithvi",
      "heading": "Earth Science and Orbital Computing: NASA-IBM Prithvi",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Foundation models are no longer confined to terrestrial hyperscale datacenters. In May 2026, NASA announced that researchers had successfully demonstrated the open-source Prithvi geospatial foundation model directly aboard two satellites in orbit—making it the first AI geospatial foundation model operated in space [12]. By processing Earth-observation imagery"
        },
        {
          "type": "paragraph",
          "text": "on orbital edge hardware rather than downlinking raw petabytes to ground stations first, satellites can detect flood extents (such as mapping Hurricane Helene flooding around Lake Norman in North Carolina), active wildfires, and environmental anomalies with sharply reduced latency [12]."
        }
      ]
    },
    {
      "id": "healthcare-and-drug-discovery",
      "heading": "Healthcare and Drug Discovery",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "In medicine, foundation models span two distinct frontiers: clinical workflow support (summarizing electronic health records, triaging radiology images, drafting prior-authorization documentation) and upstream biomedical research. While AlphaFold 3 has accelerated hypothesis generation in structural biology by modeling protein-ligand and antibody-antigen interactions at atomic resolution [9], clinical deployment remains rightly conservative. Peer-"
        },
        {
          "type": "paragraph",
          "text": "reviewed medical reviews emphasize that retrospective benchmark scores do not guarantee bedside safety; prospective clinical trials, calibration against rare patient cohorts, and seamless integration into hospital audit trails remain mandatory hurdles before autonomous clinical action."
        }
      ]
    },
    {
      "id": "advantages-limitations-and-systemic-risks",
      "heading": "Advantages, Limitations, and Systemic Risks",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "The same architectural properties that make foundation models extraordinarily productive also generate failure modes unfamiliar to classical software engineering."
        }
      ]
    },
    {
      "id": "structural-advantages",
      "heading": "Structural Advantages",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Amortized pretraining and sample efficiency: Downstream teams can achieve high accuracy on specialized tasks using hundreds of labeled examples—or none at all—rather than millions [1], [6]."
        },
        {
          "type": "paragraph",
          "text": "Cross-modal unification: A single model can reason jointly across spreadsheets, PDFs, codebases, photographs, and audio transcripts, collapsing brittle multi-stage pipelines [20]."
        },
        {
          "type": "paragraph",
          "text": "R apid prototyping: Natural-language prompting shrinks the cycle from product idea to working prototype from months to hours."
        }
      ]
    },
    {
      "id": "technical-limitations",
      "heading": "Technical Limitations",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Confabulation (hallucination): Because generative foundation models predict plausible continuations rather than querying a verified truth table, they can produce fluent, confident falsehoods—including fabricated legal citations or distorted summaries—as documented in both the GPT-4 Technical Report and NIST's Generative AI Profile [4], [30]."
        },
        {
          "type": "paragraph",
          "text": "Static knowledge and weak continual learning: Once pretraining finishes, a model's weights remain frozen. It cannot organically learn from daily operational feedback without risking catastrophic forgetting or introducing unverified drift. Poor meta-cognition and causal reasoning: Foundation models excel at statistical correlation within their training distribution, yet they remain poorly calibrated about the boundaries of their own knowledge and struggle with genuine causal intervention outside memorized patterns."
        }
      ]
    },
    {
      "id": "systemic-and-societal-risks",
      "heading": "Systemic and Societal Risks",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Homogenization of bias and algorithmic monoculture: When hundreds of hiring platforms, lending tools, and triage assistants inherit the same base model, any latent demographic skew or cultural blind spot encoded during pretraining is amplified across society simultaneously [1], [30]."
        },
        {
          "type": "paragraph",
          "text": "Single points of security failure: Vulnerabilities such as indirect prompt injection, training-data poisoning, or jailbreaks discovered in one widely adopted base model can compromise thousands of downstream applications at once [30]."
        },
        {
          "type": "paragraph",
          "text": "Copyright, consent, and data provenance: Pretraining on vast web scrapes has triggered ongoing global litigation and licensing disputes over copyrighted books, journalism, music, and code—a risk NIST explicitly flags under Intellectual Property and Value Chain transparency [30]."
        },
        {
          "type": "paragraph",
          "text": "Compute concentration and capital barriers: Epoch AI's 2025 analysis estimated that the amortized hardware capital expenditure and energy cost for the final training run alone reached roughly \\$40 million for GPT-4 and \\$30 million for Gemini Ultra, with frontier training costs rising by 2.4x per year since 2016 [26]. Including R&D staff and failed experimental runs pushes total development budgets far higher, concentrating frontier pretraining among a small circle of hyperscalers and well-capitalized labs. Energy and environmental footprint: Training and serving foundation models at global scale carries a measurable physical footprint. According to the International Energy Agency's (IEA) April 2025 *Energy and AI* report, global data centers consumed approximately 415 terawatt-hours (TWh) of electricity in 2024—roughly 1.5% of total global electricity consumption [27]. In April 2026, the IEA reported that global data center electricity demand surged another 17 % in 2025, with AI-focused facilities growing faster still [27]. Whereas a conventional data center typically draws 10 to 25 megawatts (MW), a modern hyperscale AI-focused facility can demand 100 MW or more—comparable to the annual electricity consumption of 100,000 households— placing acute localized strain on regional power grids and water-cooling infrastructure [27]."
        }
      ]
    },
    {
      "id": "governance-regulation-and-transparency-benchmarks",
      "heading": "Governance, Regulation, and Transparency Benchmarks",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "As foundation models matured from research curiosities into critical economic infrastructure, voluntary industry norms collided with binding legislation. Three institutional pillars now define the global governance landscape."
        },
        {
          "type": "image",
          "src": "/images/blog/diagrams/article15/06-transparency-scale-paradox.svg",
          "alt": "Dual-panel empirical chart plotting Epoch AI frontier training compute growth (4x-5x/year crossing the EU AI Act 10^25 FLOPs threshold) alongside Stanford CRFM FMTI transparency scores (37 -> 58 -> 40).",
          "caption": "Fig. 15.6 — The transparency and scale paradox: exponential frontier compute growth contrasted with fluctuating public transparency scores.",
          "width": 1200,
          "height": 675
        }
      ]
    },
    {
      "id": "the-stanford-foundation-model-transparency-index-fmti",
      "heading": "The Stanford Foundation Model Transparency Index (FMTI)",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Beginning in October 2023, Stanford CRFM launched the Foundation Model Transparency Index (FMTI) to score major developers across 100 standardized transparency indicators spanning training data, compute, labor practices, capabilities, risks, and downstream impact [29]. The trajectory has proven sobering. In the inaugural October 2023 assessment of 10 developers, the average score was just 37 out o f 100 ( with a top score of 54) [29]. When CRFM invited 14 developers to subm it af firmative transparency reports i*n Ma*y 2024, th e average cl imbed to 58 out of 100 [29]. By December 2025, however, the third edition of the FMTI—which expanded indicators around data acquisition and post-deployment monitoring and added companies such as Alibaba, DeepSeek, and xAI—documented a sharp reversal: the average score dropped from 58 in 2024 to 40 in 2025 [29]. While IBM stood out as a"
        },
        {
          "type": "paragraph",
          "text": "transparency outlier with a score of 95, the lowest scorers (xAI and Midjourney) scored just 14, and most frontier labs remained deeply opaque about training datasets, compute budgets, and real-world usage harms [29]."
        }
      ]
    },
    {
      "id": "nist-ai-risk-management-framework-and-generative-ai-profile",
      "heading": "NIST AI Risk Management Framework and Generative AI Profile",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "In the United States, federal standards efforts have centered on the National Institute of Standards and Technology (NIST). Released in January 2023, NIST AI RMF 1.0 (NIST AI 100-1) established a voluntary, lifecycle-wide risk framework organized around four core functions: Govern, Map, Measure, and Manage [30]. In July 2024, NIST published its companion"
        },
        {
          "type": "paragraph",
          "text": "Generative Artificial Intelligence Profile (NIST AI 600-1), mapping twelve risk categories unique to or exacerbated by foundation models—including confabulation, CBRN (chemical, biological, radiological, or nuclear) misuse, data privacy, harmful bias and homogenization, intellectual property, environmental impact, and value-chain opacity— into concrete organizational controls [30]. Though voluntary by statute, NIST AI RMF and the certifiable"
        },
        {
          "type": "paragraph",
          "text": "international management standard ISO/IEC 42001 (published December 2023) have rapidly become baseline procurement requirements across regulated U.S. and global enterprises."
        }
      ]
    },
    {
      "id": "the-european-union-ai-act-gpai-regime",
      "heading": "The European Union AI Act (GPAI Regime)",
      "level": 3,
      "blocks": [
        {
          "type": "paragraph",
          "text": "The European Union took the binding legislative route. Regulation (EU) 2024/1689—the EU AI Act—was published in the Official Journal on July 12, 2024, and entered into force on August 1, 2024 [31]. Rather than regulating only end-user applications, the Act carved out a dedicated"
        },
        {
          "type": "paragraph",
          "text": "chapter for General-Purpose AI (GPAI) models—its legal term for foundation models—whose obligations became applicable on August 2, 2025 [31]."
        },
        {
          "type": "paragraph",
          "text": "Under the Act, all GPAI providers placing models on the EU market must maintain technical documentation, supply integration guidance to downstream deployers, establish a policy to comply with EU copyright law, and publish a sufficiently detailed summary of their training data. Models classified as carrying systemic risk— presumed under Article 51 whenever cumulative training compute exceeds $10^{25}$ FLOPs, or by European Commission designation— face stricter duties: mandatory standardized model evaluations, adversarial red-teaming, systemic risk mitigation, cybersecurity protections, and serious-incident reporting to the EU AI Office [31]. (While subsequent 2026 EU Digital Omnibus amendments adjusted transition"
        },
        {
          "type": "paragraph",
          "text": "timelines for certain high-risk downstream systems into late 2027 and 2028, the upstream GPAI framework has already reshaped how frontier labs document releases for Europe [31].)"
        },
        {
          "type": "table",
          "headers": [
            "Governance Pillar",
            "Jurisdiction & Status",
            "Core Scope for Foundation Models",
            "Key Mechanism /Threshold"
          ],
          "rows": [
            [
              "Stanford CRFM FMTI [29]",
              "Independent academic benchmark (Global)",
              "Audits developer transparency across upstream data/compute, model specs, and downstream impact",
              "100 indicators; average score 37 (2023) → 58 (2024) → 40 (2025)"
            ],
            [
              "NIST AI RMF 1.0 & AI 600-1[30]",
              "United States (Voluntary, widely adopted in procurement)",
              "Cross-sectoral risk management for generative & dual-use foundation models",
              "4 core functions (Govern, Map, Measure, Manage); 12 GAI risk categories"
            ],
            [
              "EU AI Act (Reg. 2024/1689)[31]",
              "European Union (Binding law; GPAI rules active Aug 2, 2025)",
              "Upstream duties for all GPAI providers plus enhanced obligations for systemic-risk models",
              "Systemic-risk presumption at >\\$10^{25}\\$ FLOPs training compute (Art. 51); mandatory evaluations & incident reporting"
            ]
          ]
        }
      ]
    },
    {
      "id": "current-developments-where-the-paradigm-stands-today",
      "heading": "Current Developments: Where the Paradigm Stands Today",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Looking across research and deployment in late 2026, four empirically established shifts define the current generation of foundation models:"
        },
        {
          "type": "list",
          "ordered": true,
          "items": [
            "Test-time compute and explicit reasoning: Scaling is no longer restricted to pretraining. Following the blueprint validated by reinforcement-learned reasoning models such as DeepSeek-R1 [23], leading systems dynamically allocate additional compute at inference time— generating structured chains of thought, invoking code interpreters, and verifying intermediate derivations before answering.",
            "Sparse architectures and inference efficiency: Sparse Mixture-of-Experts architectures— pioneered openly at scale by Mixtral 8×7B [19] and now standard across trillion-parameter frontier models—decouple total stored knowledge from per-token compute cost. Combined with quantization and distillation, this has made capable small models viable on laptops, smartphones, and even orbital satellites [12].",
            "Million-token multimodal context: Context windows that once topped out at 2,048 or 4,096 tokens now routinely span hundreds of thousands to millions of tokens across interleaved text, code, images, audio, and video [20]. In many workflows, stuffing an entire codebase or technical manual directly into context now competes directly with traditional chunked RAG.",
            "Shift from static generators to agentic tool-use: Foundation models are increasingly wrapped in agentic loops that plan multi-step workflows, query APIs, edit files, and execute terminal commands—turning them from passive text predictors into active software orchestrators."
          ]
        }
      ]
    },
    {
      "id": "future-outlook-open-trajectories-and-unresolved-frontiers",
      "heading": "Future Outlook: Open Trajectories and Unresolved Frontiers",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "*The preceding sections document established research, published benchmarks, and enacted regulations. What* *follows is forward-looking analysis of open trajectories where technical and policy outcomes remain genuinely* *uncertain.*"
        },
        {
          "type": "paragraph",
          "text": "First, the industry is confronting a data and energy ceiling on naive pretraining scaling. With high-quality public web text largely exhausted, frontier labs are betting heavily on synthetic data generation, reinforcement learning in verifiable environments (mathematics, programming, formal proofs, physics simulators), and multimodal video streams. Whether synthetic data loops can sustain capability gains indefinitely without statistical collapse—or whether physical grid bottlenecks and 100 MW+ datacenter siting constraints slow compute expansion—remains an open empirical question."
        },
        {
          "type": "paragraph",
          "text": "Second, foundation models are likely to evolve from monolithic generalists into composable, hybrid systems. Mounting evidence from regulated industries suggests that pure next-token prediction struggles to acquire tacit operational judgment, causal world models, and calibrated meta-cognition. Future high-assurance deployments will likely pair foundation models with formal verifiers, symbolic solvers, persistent memory stores, and deterministic domain simulators—using the foundation model as a flexible semantic interface rather than an unverified oracle."
        },
        {
          "type": "paragraph",
          "text": "Third, embodied world models represent the next major frontier beyond screen-based software. Extending Vision-Language-Action architectures like RT-2 [8] to general-purpose"
        },
        {
          "type": "paragraph",
          "text": "robotics requires solving real-time sensorimotor latency, physical safety guarantees, and data scarcity in unstructured environments—challenges far harder than scraping the open web."
        },
        {
          "type": "paragraph",
          "text": "Finally, agentic governance remains largely unbuilt. Existing statutes such as the EU AI Act's GPAI chapter regulate upstream model providers, while voluntary frameworks like NIST AI 600-1 focus on content and system risks. Neither yet establishes clear legal liability, audit logging standards, or real-time kill-switch protocols when autonomous foundation-model agents transact money, modify production infrastructure, or interact with other agents at machine speed."
        }
      ]
    },
    {
      "id": "conclusion",
      "heading": "Conclusion",
      "level": 2,
      "blocks": [
        {
          "type": "paragraph",
          "text": "When Stanford CRFM coined the term *foundation model* in August 2021, the phrase was meant to be an analytical lens rather than a marketing slogan. Five years later, that lens has proven remarkably durable. Foundation models did not merely make existing machine learning tasks slightly more accurate; they reorganized the entire architecture of artificial intelligence around shared, self-supervised substrates that generalize across language, vision, speech, robotics, weather physics, and molecular biology."
        },
        {
          "type": "paragraph",
          "text": "Yet the Stanford researchers' original caveat—\"critically central yet incomplete\"—remains just as urgent today. A foundation model is an extraordinary compression of human and scientific patterns, capable of accelerating software engineering, democratizing Earth observation, and illuminating biomolecular structures once unreachable by computation. It is also an opaque, energy-intensive, statistically fallible component whose flaws propagate across every downstream system that leans on it. The defining engineering and civic challenge of the next decade is no longer proving that foundation models work—that question is settled. It is learning how to inspect, adapt, compose, and govern the structures we build on top of them."
        }
      ]
    }
  ],
  "faqs": [
    {
      "question": "What is the difference between a foundation model and a large language model (LLM)?",
      "answer": "Every modern large language model—such as GPT-4, Claude, or Llama 3—is a foundation model, but not every foundation model is an LLM. \"Foundation model\" is the broader paradigm coined by Stanford CRFM in 2021 for any large-scale, self-supervised base model adaptable across many downstream tasks [1]. LLMs specialize in text and code, whereas non-text foundation models operate on images (CLIP, SAM), speech (Whisper), weather grids (GraphCast), satellite imagery (Prithvi), robotics (RT-2), and biomolecular structures (AlphaFold 3) [5], [6], [9], [10]."
    },
    {
      "question": "Why did Stanford researchers call them \"foundation\" models instead of \"general AI\"?",
      "answer": "Rishi Bommasani, Percy Liang, and the Stanford CRFM team chose the word foundation specifically to capture their \"critically central yet incomplete character\" [1]. Unlike Artificial General Intelligence (AGI), a foundation model is not an autonomous, finished intelligence; it is an architectural substrate that must be adapted, grounded, and wrapped in safety and software controls to serve specific downstream tasks."
    },
    {
      "question": "Are emergent abilities in foundation models real or a measurement artifact?",
      "answer": "Both views capture part of the picture. In 2022, Wei et al. documented capabilities that appeared suddenly once models passed certain size thresholds [13]. In 2023, Schaeffer et al. showed that many of those sharp jumps smooth out into predictable curves when evaluated with continuous metrics instead of all-or-nothing exact-match scores [14]. Even when underlying statistical loss improves smoothly, however, real-world usability often crosses practical competence thresholds abruptly."
    },
    {
      "question": "When should an organization use RAG versus fine-tuning (or LoRA)?",
      "answer": "Use Retrieval-Augmented Generation (RAG) when the model needs up-to-date, proprietary, or verifiable factual information without modifying its weights [17]. Use fine-tuning—especially parameter-efficient methods like LoRA— when you need to change how the model behaves, such as enforcing a specialized output schema, adopting a domain-specific tone, or improving accuracy on a narrow technical task [16]. Many enterprise deployments combine both."
    },
    {
      "question": "What is the difference between \"open-weight\" and \"open-source\" foundation models?",
      "answer": "An open-weight model (such as Llama 3 or Mixtral 8×7B) publicly releases its trained neural parameters so developers can download, host, and fine-tune it on their own hardware [19], [22]. True open-source AI would also publish the complete pretraining datasets, data-curation scripts, and full training code under an OSI-approved license—a much higher bar that very few frontier models meet."
    },
    {
      "question": "How much energy do foundation models and AI data centers consume?",
      "answer": "According to the International Energy Agency (IEA), global data centers consumed roughly 415 TWh of electricity in 2024—about 1.5% of worldwide electricity demand—and grew by 17% in 2025 [27]. While AI is only part of total data center load, hyperscale AI-focused facilities now routinely draw 100 MW or more, compared with 10 to 25 MW for conventional data centers [27]."
    },
    {
      "question": "How does the EU AI Act regulate foundation models?",
      "answer": "The EU AI Act (Regulation (EU) 2024/1689) regulates foundation models as General-Purpose AI (GPAI) models, with core obligations applicable since August 2, 2025 [31]. All GPAI providers must maintain technical documentation, follow EU copyright policies, and publish a training-data summary. Models presumed to carry systemic risk—defined under Article 51 as exceeding $10^{25}$ FLOPs of training compute—must also undergo adversarial testing, risk mitigation, cybersecurity hardening, and serious-incident reporting [31]."
    },
    {
      "question": "Why is homogenization considered both the biggest strength and biggest risk of foundation models?",
      "answer": "Homogenization allows one breakthrough in a base model to upgrade thousands of downstream applications simultaneously [1]. Conversely, it creates monoculture risk: any bias, hallucination tendency, or security exploit embedded in the shared foundation is automatically inherited by every downstream product built upon it."
    }
  ],
  "sources": [
    {
      "id": 1,
      "title": "On the Opportunities and Risks of Foundation Models",
      "url": "https://arxiv.org/abs/2108.07258",
      "venue": "Rishi Bommasani, Drew A. Hudson, Ehsan Adeli, Percy Liang, et al. (Center for Research on Foundation Models, Stanford HAI), August 16, 2021 (v3 July 12, 2022). URL: Source Type: Academic Monograph / Preprint (arXiv)"
    },
    {
      "id": 2,
      "title": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      "url": "https://arxiv.org/abs/1810.04805",
      "venue": "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova (Google AI Language), October 11, 2018 (v2 May 24, 2019). URL: Source Type: Research Paper (arXiv / NAACL 2019)"
    },
    {
      "id": 3,
      "title": "Language Models are Few-Shot Learners",
      "url": "https://arxiv.org/abs/2005.14165",
      "venue": "Tom B. Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, et al. (OpenAI), May 28, 2020 (v4 July 22, 2020). URL: Source Type: Research Paper (arXiv / NeurIPS 2020)"
    },
    {
      "id": 4,
      "title": "GPT-4 Technical Report",
      "url": "https://arxiv.org/html/2303.08774v6",
      "venue": "OpenAI, March 2023 (v6 March 4, 2024). URL: | Source Type: Technical Report (arXiv)"
    },
    {
      "id": 5,
      "title": "Learning Transferable Visual Models From Natural Language Supervision (CLIP)",
      "url": "https://arxiv.org/abs/2103.00020",
      "venue": "Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, et al. (OpenAI), February 26, 2021. URL: | Source Type: Research Paper (arXiv / ICML 2021)"
    },
    {
      "id": 6,
      "title": "Segment Anything (SAM)",
      "url": "https://arxiv.org/abs/2304.02643",
      "venue": "Alexander Kirillov, Eric Mintun, Nikhila Ravi, Hanzi Mao, et al. (Meta AI Research), April 5, 2023. URL: Source Type: Research Paper (arXiv / ICCV 2023)"
    },
    {
      "id": 7,
      "title": "Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)",
      "url": "https://arxiv.org/pdf/2212.04356",
      "venue": "Alec Radford, Jong Wook Kim, Tao Xu, Greg Brockman, Christine McLeavey, Ilya Sutskever (OpenAI), December 6, 2022. URL: Source Type: Research Paper (arXiv)"
    },
    {
      "id": 8,
      "title": "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
      "url": "https://arxiv.org/abs/2307.15818",
      "venue": "Anthony Brohan, Noah Brown, Justice Carbajal, Yevgen Chebotar, et al. (Google DeepMind), July 28, 2023. URL: Source Type: Research Paper (arXiv / CoRL 2023)"
    },
    {
      "id": 9,
      "title": "Accurate structure prediction of biomolecular interactions with AlphaFold 3",
      "url": "https://pubmed.ncbi.nlm.nih.gov/38718835/",
      "venue": "Josh Abramson, Jonas Adler, Jack Dunger, John Jumper, et al. (Google DeepMind & Isomorphic Labs), Nature 630(8016):493–500, May 8, 2024. URL: Isomorphic Labs release & Nov 11, 2024 academic weights update: | Source Type: Peer- Reviewed Journal Article (Nature) & Official Release"
    },
    {
      "id": 10,
      "title": "Learning skillful medium-range global weather forecasting (GraphCast)",
      "url": "https://pubmed.ncbi.nlm.nih.gov/37962497/",
      "venue": "Remi Lam, Alvaro Sanchez-Gonzalez, Matthew Willson, Peter Wirnsberger, et al. (Google DeepMind), Science 382(6677):1416–1421, November 14, 2023 (arXiv December 24, 2022). URL: (arXiv preprint: Source Type: Peer- Reviewed Journal Article (Science)"
    },
    {
      "id": 11,
      "title": "FourCastNet: A Global Data-driven High-resolution Weather Model using Adaptive Fourier Neural Operators",
      "url": "https://arxiv.org/abs/2202.11214",
      "venue": "Jaideep Pathak, Shashank Subramanian, Peter Harrington, Sanjeev Raja, et al. (NVIDIA & Lawrence Berkeley National Laboratory), February 22, 2022. URL: Source Type: Research Paper (arXiv)"
    },
    {
      "id": 12,
      "title": "NASA's Prithvi Becomes First AI Geospatial Foundation Model In Orbit",
      "url": "https://science.nasa.gov/science-research/ai-geospatial-model-earth/",
      "venue": "NASA Science, May 7, 2026 (plus NASA Dec 4, 2024 update: and Hugging Face Prithvi-EO-2.0 model card: URL: | Source Type: Government Agency Science Report & Model Card"
    },
    {
      "id": 13,
      "title": "Emergent Abilities of Large Language Models",
      "url": "https://arxiv.org/abs/2206.07682",
      "venue": "Jason Wei, Yi Tay, Rishi Bommasani, Colin Raffel, et al. (Google Research / Stanford), June 15, 2022 (v2 October 26, 2022, Transactions on Machine Learning Research). URL: Source Type: Peer-Reviewed Journal Article (TMLR / arXiv)"
    },
    {
      "id": 14,
      "title": "Are Emergent Abilities of Large Language Models a Mirage?",
      "url": "https://arxiv.org/abs/2304.15004",
      "venue": "Rylan Schaeffer, Brando Miranda, Sanmi Koyejo (Stanford University), April 28, 2023 (v2 May 22, 2023, NeurIPS 2023). URL: | Source Type: Conference Paper (NeurIPS 2023 / arXiv)"
    },
    {
      "id": 15,
      "title": "Training language models to follow instructions with human feedback (InstructGPT)",
      "url": "https://arxiv.org/abs/2203.02155",
      "venue": "Long Ouyang, Jeff Wu, Xu Jiang, Diogo Almeida, et al. (OpenAI), March 4, 2022. URL: | Source Type: Research Paper (arXiv / NeurIPS 2022)"
    },
    {
      "id": 16,
      "title": "LoRA: Low-Rank Adaptation of Large Language Models",
      "url": "https://arxiv.org/abs/2106.09685",
      "venue": "Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, et al. (Microsoft Corporation), June 17, 2021 (v2 October 16, 2021). URL: | Source Type: Research Paper (arXiv / ICLR 2022)"
    },
    {
      "id": 17,
      "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
      "url": "https://arxiv.org/abs/2005.11401",
      "venue": "Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, et al. (Facebook AI Research / UCL / NYU), May 22, 2020 (v4 April 12, 2021, NeurIPS 2020). URL: Source Type: Conference Paper (NeurIPS 2020 / arXiv)"
    },
    {
      "id": 18,
      "title": "Distilling the Knowledge in a Neural Network",
      "url": "https://arxiv.org/abs/1503.02531",
      "venue": "Geoffrey Hinton, Oriol Vinyals, Jeff Dean (Google), March 9, 2015. URL: Source Type: Research Paper (arXiv / NIPS 2014 Workshop)"
    },
    {
      "id": 19,
      "title": "Mixtral of Experts",
      "url": "https://arxiv.org/abs/2401.04088",
      "venue": "Albert Q. Jiang, Alexandre Sablayrolles, Antoine Roux, Arthur Mensch, et al. (Mistral AI), January 8, 2024. URL: Source Type: Technical Paper (arXiv)"
    },
    {
      "id": 20,
      "title": "Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context",
      "url": "https://arxiv.org/html/2403.05530v2",
      "venue": "Gemini Team, Google, March 2024 (v2 April 25, 2024). URL: Source Type: Technical Report (arXiv)"
    },
    {
      "id": 21,
      "title": "Introducing Claude 3.5 Sonnet",
      "url": "https://www.anthropic.com/news/claude-3-5-sonnet",
      "venue": "Anthropic, June 21, 2024. URL: | Source Type: Official Model Announcement"
    },
    {
      "id": 22,
      "title": "The Llama 3 Herd of Models",
      "url": "https://arxiv.org/html/2407.21783v3",
      "venue": "Llama Team, AI @ Meta, July 23, 2024 (v3 November 23, 2024). URL: Source Type: Technical Report (arXiv)"
    },
    {
      "id": 23,
      "title": "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
      "url": "https://arxiv.org/html/2501.12948v1",
      "venue": "DeepSeek-AI, January 22, 2025. URL: Source Type: Technical Paper (arXiv)"
    },
    {
      "id": 24,
      "title": "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot",
      "url": "https://arxiv.org/abs/2302.06590",
      "venue": "Sida Peng, Eirini Kalliamvakou, Peter Cihon, Mert Demirer (Microsoft Research / GitHub / MIT), February 13, 2023. URL: Source Type: Empirical Research Paper (arXiv)"
    },
    {
      "id": 25,
      "title": "Morgan Stanley's new AI assistant is based on OpenAI's GPT-4",
      "url": "https://fortune.com/2023/09/20/morgan-stanley-ai-assistant-answer-investing-personal-finance-queries/",
      "venue": "Fortune, September 20, 2023 (URL: and Morgan Stanley uses AI evals to shape the future of financial services — OpenAI (URL: Source Type: Financial Journalism & Official Enterprise Case Study"
    },
    {
      "id": 26,
      "title": "The rising costs of training frontier AI models",
      "url": "https://arxiv.org/html/2405.21015v2",
      "venue": "Ben Cottier et al. (Epoch AI), February 7, 2025 (URL: in AI — Epoch AI, February 5, 2026 (URL: https:// and Over 30 AI models have been trained at the scale of GPT-4 — Epoch AI, January 30, 2025 (URL: Source Type: Independent Research Institute Analysis & Preprint"
    },
    {
      "id": 27,
      "title": "Energy and AI: Executive Summary & Understanding the Energy-AI Nexus",
      "url": "https://www.iea.org/reports/energy-and-ai/executive-summary",
      "venue": "International Energy Agency (IEA), April 10, 2025 (URLs: Key Questions on Energy and AI: Executive Summary — IEA, April 2026 (URL: | Source Type: Intergovernmental Energy Report"
    },
    {
      "id": 28,
      "title": "The 2025 AI Index Report",
      "url": "https://hai.stanford.edu/ai-index/2025-ai-index-report",
      "venue": "Stanford Institute for Human-Centered Artificial Intelligence (HAI), April 2025. URL: Source Type: Annual Academic Benchmark Report"
    },
    {
      "id": 29,
      "title": "The 2025 Foundation Model Transparency Index",
      "url": "https://arxiv.org/abs/2512.10169",
      "venue": "Alexander Wan, Kevin Klyman, Sayash Kapoor, Nestor Maslej, Shayne Longpre, Betty Xiong, Percy Liang, Rishi Bommasani (Stanford CRFM), December 11, 2025 (URL: Foundation Model Transparency Index, May 2024 — Stanford CRFM, May 2024 (URL: | Source Type: Academic Governance Benchmark Report"
    },
    {
      "id": 30,
      "title": "Artificial Intelligence Risk Management Framework (AI RMF 1.0, NIST AI 100-1)",
      "url": "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf",
      "venue": "National Institute of Standards and Technology (NIST), January 2023 (URL: and Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1) — NIST, July 2024 (URL: | Source Type: U.S. Federal Technical Standards"
    },
    {
      "id": 31,
      "title": "Regulation (EU) 2024/1689 of the European Parliament and of the Council (Artificial Intelligence Act",
      "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02024R1689-20260727",
      "venue": "Consolidated Text) — European Union, published July 12, 2024; entered into force August 1, 2024; consolidated July 27, 2026. URL: | Source Type: Official Legislation (EUR-Lex)"
    }
  ],
  "relatedSlugs": [
    "understanding-transformers-architecture-behind-modern-ai",
    "how-machine-learning-models-are-trained",
    "narrow-ai-vs-general-ai-vs-superintelligence",
    "future-of-machine-learning-and-intelligent-computing"
  ],
  "internalLinks": [
    {
      "label": "Experience Omnia 1.0 Foundation Studio",
      "href": "/ai",
      "description": "Combine conversational reasoning, live Google Search RAG grounding, and creative synthesis in one workspace."
    },
    {
      "label": "Platform Architecture & Pillars",
      "href": "/features",
      "description": "Discover how VIZRA pairs foundation model intelligence with structured 10-stage memory."
    }
  ],
  "body": [
    "For the better part of thirty years, machine learning operated like a guild of hyper-specialized artisans. If a hospital needed software to flag tumors on chest radiographs, engineers assembled tens of thousands of hand-labeled X-rays and trained a convolutional neural network from scratch. If a bank wanted to classify customer support tickets, a separate team curated labeled transcripts and trained a completely different model. Neither system knew anything about the other's domain, and neither could step outside the narrow perimeter of its training labels without collapsing.",
    "Between 2018 and 2021, that one-task, one-model workflow began to dissolve. Researchers discovered that a single neural network trained on vast, largely unlabeled corpora—internet text, paired images and captions, raw audio, or decades of atmospheric measurements—could serve as a reusable substrate for dozens or hundreds of downstream applications. In August 2021, an interdisciplinary team of more than one hundred researchers at Stanford University's newly formed Center for Research on Foundation Models (CRFM) gave this shift a name. In their landmark 214-page monograph, *On the Opportunities and Risks of Foundation Models*, Rishi Bommasani, Percy Liang, and their collaborators defined a foundation model as \"any model that is trained on broad data (generally using self-supervision at scale) that can be adapted (e.g., fine-tuned) to a wide range of downstream tasks\" [1].",
    "The choice of the word *foundation* was deliberate, and it carried a subtle warning that is often lost in popular coverage. As the Stanford authors wrote, they coined the term \"to underscore their critically central yet incomplete character\" [1]. A foundation is not a finished building. It",
    "bears the structural load of everything constructed atop it, which grants enormous engineering leverage—and means that any crack in the concrete propagates upward into every room. Five years after that report appeared, foundation models have expanded far beyond chatbots and text completion. They now segment satellite imagery from low Earth orbit [12], predict the three-dimensional interactions of proteins, DNA, and small-molecule drugs [9], generate ten-day global weather forecasts in under a minute [10], and translate natural-language commands directly into robotic arm movements [8]. Understanding what foundation models actually are—",
    "technically, economically, and socially—has become essential to understanding modern computing.",
    "Foundation models did not appear out of thin air; they represent the third major wave of consolidation in modern machine learning [1]. In classical machine learning during the 1990s"
  ]
};
