// Science Skills Service for Omnia (DeepMind Science Suite)
// Provides biomedical, protein, genomic, chemical, and PubMed literature querying.

export interface ScienceQueryItem {
  type: 'protein' | 'compound' | 'literature' | 'pathway';
  query: string;
}

export interface ProteinStructureData {
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotId: string;
  uniprotDescription: string;
  organismScientificName: string;
  sequenceLength: number;
  cifUrl: string;
  bcifUrl: string;
  pdbUrl: string;
  paeDocUrl?: string;
}

export interface CompoundData {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: string;
  smiles: string;
  iupacName?: string;
  xLogP?: number;
  tpsa?: number;
  hBondDonorCount?: number;
  hBondAcceptorCount?: number;
  rotatableBondCount?: number;
  structureImageUrl: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  doi?: string;
  url: string;
}

/**
 * Fetch AlphaFold DB prediction metadata by UniProt accession or gene symbol
 */
export async function fetchAlphaFoldStructure(uniprotOrGene: string): Promise<ProteinStructureData | null> {
  const clean = uniprotOrGene.trim().toUpperCase();
  try {
    // Query via server science proxy to avoid CORS/403 header restrictions
    const proxyRes = await fetch('/api/science/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'protein', query: clean }),
    });

    let data: any[] | null = null;
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      data = json.data;
    } else {
      // Direct client fallback with User-Agent
      const res = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(clean)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        data = await res.json();
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      const p = data[0];
      return {
        entryId: p.entryId || `AF-${clean}-F1`,
        gene: p.gene || clean,
        uniprotAccession: p.uniprotAccession || clean,
        uniprotId: p.uniprotId || clean,
        uniprotDescription: p.uniprotDescription || 'Protein structure prediction',
        organismScientificName: p.organismScientificName || 'Homo sapiens',
        sequenceLength: p.uniprotEnd || (p.uniprotSequence ? p.uniprotSequence.length : 0),
        cifUrl: p.cifUrl,
        bcifUrl: p.bcifUrl,
        pdbUrl: p.pdbUrl,
        paeDocUrl: p.paeDocUrl,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch AlphaFold structure:', err);
  }
  return null;
}

/**
 * Fetch small molecule compound properties and 2D structure from PubChem
 */
export async function fetchPubChemCompound(nameOrCid: string): Promise<CompoundData | null> {
  const clean = nameOrCid.trim();
  try {
    let cid: number | null = null;
    if (/^\d+$/.test(clean)) {
      cid = parseInt(clean, 10);
    } else {
      // Resolve compound name to CID
      const cidRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(clean)}/cids/JSON`
      );
      if (!cidRes.ok) return null;
      const cidData = await cidRes.json();
      cid = cidData?.IdentifierList?.CID?.[0] || null;
    }

    if (!cid) return null;

    // Fetch calculated properties
    const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount/JSON`;
    const propRes = await fetch(propsUrl);
    if (!propRes.ok) return null;
    const propData = await propRes.json();
    const props = propData?.PropertyTable?.Properties?.[0];

    if (!props) return null;

    return {
      cid,
      name: clean,
      molecularFormula: props.MolecularFormula || '',
      molecularWeight: props.MolecularWeight ? String(props.MolecularWeight) : '',
      smiles: props.CanonicalSMILES || '',
      iupacName: props.IUPACName,
      xLogP: props.XLogP,
      tpsa: props.TPSA,
      hBondDonorCount: props.HBondDonorCount,
      hBondAcceptorCount: props.HBondAcceptorCount,
      rotatableBondCount: props.RotatableBondCount,
      structureImageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=300x300`,
    };
  } catch (err) {
    console.warn('Failed to fetch PubChem compound:', err);
  }
  return null;
}

/**
 * Search biomedical research literature via NCBI PubMed E-utilities
 */
export async function searchPubMedLiterature(term: string, limit = 5): Promise<PubMedArticle[]> {
  try {
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      term
    )}&sort=pub_date&retmode=json&retmax=${limit}`;
    const searchRes = await fetch(esearchUrl);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const idList: string[] = searchData?.esearchresult?.idlist || [];
    if (idList.length === 0) return [];

    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(
      ','
    )}&retmode=json`;
    const sumRes = await fetch(esummaryUrl);
    if (!sumRes.ok) return [];
    const sumData = await sumRes.json();
    const resultObj = sumData?.result || {};

    const articles: PubMedArticle[] = [];
    for (const id of idList) {
      const art = resultObj[id];
      if (!art) continue;
      const authors = Array.isArray(art.authors)
        ? art.authors.map((a: any) => a.name).filter(Boolean)
        : [];
      const doiObj = Array.isArray(art.articleids)
        ? art.articleids.find((i: any) => i.idtype === 'doi')
        : undefined;

      articles.push({
        pmid: id,
        title: art.title || 'Untitled',
        authors: authors.slice(0, 3),
        journal: art.source || 'PubMed',
        pubDate: art.pubdate || '',
        doi: doiObj?.value,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      });
    }

    return articles;
  } catch (err) {
    console.warn('Failed to search PubMed:', err);
    return [];
  }
}
