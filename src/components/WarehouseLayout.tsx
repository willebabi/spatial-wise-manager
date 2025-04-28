
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createLayout, getLayouts, deleteLayout, Layout } from "@/lib/database";

interface WarehouseLayoutProps {
  setSelectedLayout: React.Dispatch<React.SetStateAction<any>>;
}

const WarehouseLayout: React.FC<WarehouseLayoutProps> = ({ setSelectedLayout }) => {
  const [layoutName, setLayoutName] = useState("");
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      const loadedLayouts = await getLayouts();
      setLayouts(loadedLayouts);
      
      // Select the first layout by default if available
      if (loadedLayouts.length > 0 && loadedLayouts[0].id) {
        setSelectedLayout(loadedLayouts[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar layouts:", error);
      toast.error("Falha ao carregar layouts");
    }
  };

  const handleCreateLayout = async () => {
    if (!layoutName.trim()) {
      toast.error("Nome do layout é obrigatório");
      return;
    }

    if (rows < 1 || columns < 1) {
      toast.error("Linhas e colunas devem ser pelo menos 1");
      return;
    }

    setLoading(true);
    try {
      await createLayout({
        name: layoutName,
        rows,
        columns
      });
      
      toast.success(`Layout "${layoutName}" criado com sucesso`);
      setLayoutName("");
      await loadLayouts();
    } catch (error) {
      console.error("Erro ao criar layout:", error);
      toast.error("Falha ao criar layout");
    }
    setLoading(false);
  };

  const handleDeleteLayout = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este layout? Isso excluirá todos os grupos e locações associados a ele.")) {
      try {
        await deleteLayout(id);
        toast.success("Layout excluído com sucesso");
        // If the deleted layout was selected, reset the selection
        setSelectedLayout(null);
        await loadLayouts();
      } catch (error) {
        console.error("Erro ao excluir layout:", error);
        toast.error("Falha ao excluir layout");
      }
    }
  };

  const handleSelectLayout = (layout: Layout) => {
    setSelectedLayout(layout);
    toast.success(`Layout "${layout.name}" selecionado`);
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Criar Novo Layout</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="layoutName">Nome do Layout</Label>
              <Input
                id="layoutName"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="Digite o nome do layout"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rows">Linhas</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="columns">Colunas</Label>
                <Input
                  id="columns"
                  type="number"
                  min={1}
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCreateLayout} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Criando..." : "Criar Layout"}
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-3">Visualização do Layout</h3>
            <div className="overflow-x-auto border rounded-md p-4">
              <div 
                className="grid gap-1" 
                style={{ 
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  minWidth: columns * 40
                }}
              >
                {Array(rows).fill(0).map((_, rowIndex) => (
                  Array(columns).fill(0).map((_, colIndex) => (
                    <div 
                      key={`${rowIndex}-${colIndex}`}
                      className="warehouse-cell flex items-center justify-center"
                    >
                      <span className="text-xs text-gray-500">
                        {rowIndex + 1}-{colIndex + 1}
                      </span>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Layouts Existentes</h2>
          
          {layouts.length === 0 ? (
            <div className="text-center p-6 border rounded-md bg-gray-50">
              <p>Nenhum layout criado ainda.</p>
              <p className="text-gray-500">Crie seu primeiro layout para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {layouts.map((layout) => (
                <div 
                  key={layout.id}
                  className={`p-4 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                    layout.id === (layouts.find((l) => l.id)?.id) ? "border-primary" : ""
                  }`}
                  onClick={() => handleSelectLayout(layout)}
                >
                  <div>
                    <h3 className="font-medium">{layout.name}</h3>
                    <p className="text-sm text-gray-500">
                      {layout.rows} linhas × {layout.columns} colunas
                    </p>
                    <p className="text-xs text-gray-400">
                      Criado em: {new Date(layout.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLayout(layout);
                      }}
                    >
                      Selecionar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (layout.id) handleDeleteLayout(layout.id);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseLayout;
